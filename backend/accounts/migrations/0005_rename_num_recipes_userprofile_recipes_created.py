# Generated by Django 4.1.7 on 2023-03-13 02:54

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_userprofile_num_recipes'),
    ]

    operations = [
        migrations.RenameField(
            model_name='userprofile',
            old_name='num_recipes',
            new_name='recipes_created',
        ),
    ]
