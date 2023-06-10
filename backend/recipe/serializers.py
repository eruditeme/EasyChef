import base64
import math
import random

from django.core.files.base import ContentFile
from django.db.models import Avg
from rest_framework import serializers
from django.contrib.auth.models import User

from accounts.models import UserProfile
from core.utils import get_user_profile
from recipe.models import Rating, Recipe, Ingredient, Diet, RecipeDiets, Comment, Favorite, Cuisine, CommentAttachment, \
    RecipeAttachment


class IngredientSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Ingredient
        fields = ('id', 'name', 'quantity')


class AttachmentSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    attachment = serializers.FileField()

    class Meta:
        model = CommentAttachment
        fields = ('id', 'attachment')


class IngredientAutocompleteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ('name',)


class DietSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    name = serializers.CharField(required=False)

    class Meta:
        model = Diet
        fields = ('id', 'name')


class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ('recipe',)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('full_name', 'avatar')


class CreatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('id', 'full_name')


class CuisineSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    name = serializers.CharField(required=False)

    class Meta:
        model = Cuisine
        fields = ('id', 'name')


class AttachmentSerializer(serializers.ModelSerializer):
    attachment = serializers.CharField(required=False)

    class Meta:
        model = RecipeAttachment
        fields = ('attachment',)


class CookingTimeSerializer(serializers.Serializer):
    cooking_times = serializers.ListField(child=serializers.CharField())


class RecipeListSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    ingredients = IngredientSerializer(many=True, read_only=True)
    diets = DietSerializer(many=True, read_only=True)
    cuisine = CuisineSerializer(read_only=True)
    user_full_name = UserSerializer(source='user', read_only=True)
    rating = serializers.SerializerMethodField('get_average_rating')
    number_of_comments = serializers.SerializerMethodField('get_number_of_comments')
    number_of_saves = serializers.SerializerMethodField('get_number_of_saves')

    @staticmethod
    def get_number_of_saves(foo):
        return Favorite.objects.filter(recipe=foo.id).count()

    @staticmethod
    def get_number_of_comments(foo):
        return Comment.objects.filter(recipe=foo.id).count()

    @staticmethod
    def get_average_rating(foo):
        rating = Rating.objects.filter(recipeID=foo.id).aggregate(Avg('rating'))
        return rating['rating__avg'] if rating['rating__avg'] else 0

    class Meta:
        model = Recipe
        fields = ('id', 'steps', 'name', 'prep_time', 'cooking_time',
                  'serving', 'preview_picture', 'user', 'diets',
                  'ingredients', 'cuisine', 'base_recipe',
                  'user_full_name', 'rating', 'number_of_comments', 'number_of_saves')


class RecipePreviewPictureUploadSerializers(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = ('preview_picture',)


class RecipeSerializers(serializers.ModelSerializer):
    ingredients = IngredientSerializer(many=True, required=True)
    diets = DietSerializer(many=True, required=False, allow_null=True)
    steps = serializers.CharField(required=False, allow_blank=True)
    prep_time = serializers.CharField(required=False, allow_blank=True)
    cooking_time = serializers.CharField(required=False, allow_blank=True)
    user_full_name = UserSerializer(source='user', read_only=True)
    rating = serializers.SerializerMethodField('get_average_rating')
    number_of_comments = serializers.SerializerMethodField('get_number_of_comments')
    attachments = AttachmentSerializer(many=True, read_only=True)
    number_of_saves = serializers.SerializerMethodField('get_number_of_saves')
    cuisine_name = serializers.CharField(source='cuisine.name', read_only=True)

    @staticmethod
    def get_number_of_comments(foo):
        if foo.__class__ is Recipe:
            return Comment.objects.filter(recipe=foo.id).count()
        else:
            return Comment.objects.filter(recipe=foo["id"]).count()

    @staticmethod
    def get_average_rating(foo):
        if foo.__class__ is Recipe:
            rating = Rating.objects.filter(recipeID=foo.id).aggregate(Avg('rating'))
            return rating['rating__avg'] if rating['rating__avg'] else 0
        else:
            rating = Rating.objects.filter(recipeID=foo["id"]).aggregate(Avg('rating'))
            return rating['rating__avg'] if rating['rating__avg'] else 0

    @staticmethod
    def get_number_of_saves(foo):
        if foo.__class__ is Recipe:
            return Favorite.objects.filter(recipe=foo.id).count()
        return Favorite.objects.filter(recipe=foo["id"]).count()

    class Meta:
        model = Recipe
        fields = ('id', 'steps', 'name', 'prep_time', 'cooking_time',
                  'serving', 'preview_picture', 'user', 'diets',
                  'ingredients', 'cuisine', 'base_recipe', 'user_full_name',
                  'rating', 'number_of_comments', 'attachments', 'cuisine_name', 'number_of_saves')

        extra_kwargs = {
            'cuisine': {'required': False},
            'base_recipe': {'required': False},
        }

    def create(self, validated_data):
        validated_data_copy = validated_data.copy()
        ingredients = validated_data_copy.pop('ingredients')
        diets = validated_data_copy.pop('diets') if 'diets' in validated_data_copy else []

        recipe = Recipe.objects.create(**validated_data_copy)
        validated_data['id'] = recipe.id

        for ingredient in ingredients:
            ingredient_obj = Ingredient.objects.create(**ingredient, recipe=recipe)
            ingredient['id'] = ingredient_obj.id

        for diet in diets:
            RecipeDiets.objects.create(recipe=recipe, diet_id=diet['id'])

        return validated_data

    def update(self, instance, validated_data):

        validated_data_copy = validated_data.copy()
        ingredients = validated_data_copy.pop('ingredients')
        diets = validated_data_copy.pop('diets') if 'diets' in validated_data_copy else []

        # Update general recipe data
        for key, value in validated_data_copy.items():
            setattr(instance, key, value)

        instance.save()

        # Update ingredients of recipe
        # Creat/Update
        for ingredient in ingredients:
            if 'id' in ingredient:
                if not Ingredient.objects.filter(id=ingredient['id'], recipe=instance).exists():
                    continue

                ingredient_obj = Ingredient.objects.get(id=ingredient['id'])
                ingredient_obj.name = ingredient['name']
                ingredient_obj.quantity = ingredient['quantity']
                ingredient_obj.save()
            else:
                ingredient_obj = Ingredient.objects.create(**ingredient, recipe=instance)
                ingredient['id'] = ingredient_obj.id
        # Delete
        initial_ingredients = Ingredient.objects.filter(recipe=instance)
        current_ids = [x['id'] for x in ingredients]
        for ingredient in initial_ingredients:
            if not current_ids.__contains__(ingredient.id):
                ingredient.delete()

        # Update diets of recipe
        # Delete
        initial_diets = RecipeDiets.objects.filter(recipe=instance).select_related('diet')
        current_diets_ids = [x['id'] for x in diets]
        for diet in initial_diets:
            if not current_diets_ids.__contains__(diet.diet.id):
                diet.delete()
        # Add
        for diet in current_diets_ids:
            if not RecipeDiets.objects.filter(recipe=instance, diet_id=diet).exists() and Diet.objects.filter(
                    id=diet).exists():
                RecipeDiets.objects.create(recipe=instance, diet_id=diet)

        return validated_data

    @staticmethod
    def validate_ingredients(value):
        if len(value) == 0:
            raise serializers.ValidationError("Recipe must have at least 1 ingredient.")
        return value


class RatingSerializer(serializers.ModelSerializer):
    recipeID = serializers.CharField(read_only=True)

    class Meta:
        model = Rating
        fields = ('rating', 'recipeID')

    def create(self, validated_data):
        recipe_id = self.context.get('view').kwargs.get('id', '')
        user_id = self.context['request'].user.id
        user = get_user_profile(user_id)
        print(user)
        try:
            recipe = Recipe.objects.get(id=recipe_id)
        except:
            raise serializers.ValidationError("Recipe does not exist")

        if rating := Rating.objects.filter(user=user, recipeID=recipe_id):
            rating.delete()

        valid_data = validated_data | {'user': user, 'recipeID': recipe}

        return super().create(valid_data)


class AddCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    attachments = AttachmentSerializer(many=True, required=False)
    user_full_name = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'recipe', 'date_created', 'user', 'user_name', 'text', 'attachments', 'user_full_name')

    def create(self, validated_data):
        validated_data_copy = validated_data.copy()
        attachments = self.data.get('attachments', [])

        comment = Comment.objects.create(recipe_id=validated_data_copy['recipe'], user_id=validated_data_copy['user'], text=validated_data_copy['text'])

        # validated_data.update({'id', comment.id})
        comment_attachments = []
        for attachment in attachments:
            format, imgstr = attachment["attachment"].split(';base64,')
            print("format", format)
            ext = format.split('/')[-1]

            data = ContentFile(base64.b64decode(imgstr))
            data.name = f"{comment.id}_{random.randint(0,100000)}_preview_picture.png"
            file = data

            comment_attachment = CommentAttachment.objects.create(attachment=file, comment=comment)
            comment_attachments.append(comment_attachment)

        validated_data.update({'attachments': comment_attachments})

        return validated_data
