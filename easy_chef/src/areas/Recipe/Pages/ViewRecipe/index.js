import React, {useEffect, useState} from 'react';
import api from "../../../../core/baseAPI";
import Comments from "./Comments";
import Ingredients from './Ingredients';
import {useParams} from 'react-router-dom';
import {Link} from "react-router-dom"
import parse from 'html-react-parser'
import {Offcanvas, OffcanvasBody, OffcanvasHeader} from 'reactstrap';
import {FaStar} from "react-icons/fa";
import toast from 'react-hot-toast'
import {CarouselComponent, CarouselItemsDirective, CarouselItemDirective} from '@syncfusion/ej2-react-navigations';
import {ButtonComponent} from '@syncfusion/ej2-react-buttons';
import {Container, Radio, Rating} from "./RatingStyles.js";
import Carousel from "react-bootstrap/Carousel";

const ViewRecipe = () => {
    const [recipeName, setRecipe] = useState("");
    const [creatorName, setCreatorName] = useState("");
    const [cuisineName, setCuisine] = useState("");
    const [preptime, setPrepTime] = useState("");
    const [diet, setDiet] = useState([]);
    const [serving, setServing] = useState(1);
    const [cookingTime, setCookingTime] = useState("");
    const [allcomment, setallcomment] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [step, setStep] = useState("");
    const [ingredientList, setIngredientList] = useState([]);
    const [isFavorite, setFavorite] = useState(false);
    const [baseRecipeId, setBaseRecipeId] = useState(false);
    const {id} = useParams();
    const rec_id = id;
    const [currentuserid, setcurrentuserid] = useState('');
    const [recipeuserid, setrecipeuserid] = useState('');
    const [rating, setRating] = useState(0);
    const [numfavs, setnumfavs] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [comment, setComment] = useState('');
    const [rate, setRate] = useState(0);
    const token = localStorage.getItem("user_tokens");

    const handleCommentChange = event => {
        setComment(event.target.value);
    };

    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    };

    const tobase64Handler = async (files) => {
        const filePathsPromises = [];
        const arr = Array.from(files);
        arr.forEach(file => {
            filePathsPromises.push(toBase64(file));
        });
        const filePaths = await Promise.all(filePathsPromises);
        const fl = filePaths.map((base64File) => ({selectedFile: base64File}));
        return fl;
    }

    const handleFileSelect = (event) => {
        const files = event.target.files;
        const base64Files = tobase64Handler(files);

        base64Files.then(i => setSelectedFiles(i.map(fl => fl.selectedFile)));
    };

    const [canvasOpen, setCanvasOpen] = useState(false)
    const toggleCanvas = () => {
        if (token) {
            setCanvasOpen(!canvasOpen);
        }
    }

    useEffect(() => {
        if (token) {
            api.get(`/accounts/edit-profile/`)
                .then((response) => {
                    setcurrentuserid(response.data.id);
                });
        }
        api.get(`/recipe/details/${id}/`)
            .then((response) => {
                setRecipe(response.data.name);
                setCreatorName(response.data.user_full_name.full_name);
                setCuisine(response.data.cuisine_name);
                setPrepTime(response.data.prep_time);
                setDiet(response.data.diets);
                setServing(response.data.serving);
                setBaseRecipeId(response.data.base_recipe);
                setCookingTime(response.data.cooking_time);
                setStep(response.data.steps);
                setIngredientList(response.data.ingredients);
                setrecipeuserid(response.data.user);
                setRating(response.data.rating);
                setnumfavs(response.data.number_of_saves);

                let perv_picture = [];
                if (response.data.preview_picture)
                    perv_picture.push(response.data.preview_picture);
                const attch = perv_picture.concat(response.data.attachments.map(i => i.attachment));
                setAttachments(attch)
            });
        api.get(`/recipe/all-comments/${id}/`)
            .then((response) => {
                setallcomment(response.data);
            });
        if (token) {
            api.get('/recipe/favorites/')
                .then((response) => {
                    response.data.map((m) => {
                        if (String(m.id) === String(id)) {
                            setFavorite(true);
                        }
                        return null;
                    })
                });
        }
    }, [id]);

    function getPersonalButtons() {
        if (currentuserid === recipeuserid) {
            return (
                <>
                    <Link to={`../edit-recipe/${id}`}
                          className="btn btn-primary btn-md waves-effect waves-light btn_space m-1"
                          type="button">Edit</Link>
                    <Link to={`../all-recipes`}
                          onClick={deleteClick}
                          className="btn btn-outline-primary btn-md waves-effect waves-light btn_space m-1"
                          type="button">Delete
                    </Link>
                </>
            )
        }
    }

    function getCommentAbility() {
        if (token) {
            return (
                <>
                    <div className="chat-history-footer shadow-sm p-2">
                        <form className="form-send-message d-flex justify-content-between align-items-center"
                              onSubmit={handleSubmit}>
                            <input className="form-control message-input border-0 me-1 shadow-none"
                                   value={comment} onChange={handleCommentChange}
                                   placeholder="Type comment here"></input>
                            <div className="message-actions d-flex align-items-center">
                                <label htmlFor="attach-doc" className="form-label mb-0">
                                    <i className="ti ti-paperclip ti-sm cursor-pointer mx-1"></i>
                                    <input
                                        id="attach-doc"
                                        hidden
                                        type="file"
                                        multiple
                                        onChange={handleFileSelect}
                                    />
                                </label>
                                <button className="btn btn-primary d-flex send-msg-btn" type="submit">
                                    <i className="ti ti-send me-md-1 me-0"></i>
                                    <span className="align-middle d-md-inline-block d-none"></span>
                                </button>
                            </div>
                        </form>
                    </div>
                </>
            )
        }
    }

    function getloggedinButtons() {
        if (Number.isInteger(currentuserid)) {
            return (
                <>
                    <button onClick={addClick} className="btn btn-primary btn-md waves-effect waves-light btn_space m-1"
                            type="button">Add to Shopping Cart
                    </button>
                    <Link to={`../new-recipe/${id}`}
                          className="btn btn-primary btn-md waves-effect waves-light btn_space m-1" type="button">
                        Convert to New Recipe
                    </Link>
                </>
            )
        }
    }

    function getBaseRecipeButton() {
        if (baseRecipeId) {
            return (
                <Link to={`/view-recipe/${baseRecipeId}`}
                      className="btn btn-primary btn-md waves-effect waves-light btn_space m-1" type="button">
                    View Base Recipe
                </Link>
            );
        }
    }

    function getloggedindiv() {
        if (Number.isInteger(currentuserid)) {
            return (
                <>
                <div className="card mb-4 p-2">
                    {getloggedinButtons()}
                    {getBaseRecipeButton()}
                    {getPersonalButtons()}
                    </div>
                </>
            )
        }
    }

    function deleteClick() {
        api.delete(`/recipe/delete/${id}`)
            .then(response => {
                toast.success('Recipe deleted successfully')
                console.log('Recipe deleted successfully');
            })
            .catch(error => {
                toast.error('Error deleting recipe')
                console.error('Error deleting recipe', error);
            });
    }

    function addClick() {
        const requestOptions = {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            servingSize: String(serving),
            recipeID: String(rec_id)
        };

        api.post(`/shopping-list/add-recipe/`, requestOptions)
            .then(response => {
                toast.success('Recipe added to shopping list')
                console.log('Recipe added to shopping list');
            })
            .catch(error => {
                toast.error('Error adding recipe to shopping cart. Recipe was already added')
                console.error('Error adding recipe to shopping cart', error);
            });
    }

    function FavoriteButtonClick() {
        if (token) {
            if (isFavorite) {
                api.delete(`/recipe/remove-from-favorite/${id}/`)
                    .then(() => {
                        setFavorite(false);
                        toast.success('Recipe removed from favorite')
                    })
                api.get(`/recipe/details/${id}/`)
                    .then((response) => {
                        setnumfavs(response.data.number_of_saves);
                    });
            } else {
                api.post(`/recipe/add-to-favorite/${id}/`)
                    .then(() => {
                        setFavorite(true)
                        toast.success('Recipe marked as favorite')
                    });
                api.get(`/recipe/details/${id}/`)
                    .then((response) => {
                        setnumfavs(response.data.number_of_saves);
                    });
            }
        }
    }

    const handleServingChange = (event) => {
        setServing(event.target.value);
    };

    function SaveRating() {
        api.post(`/recipe/rate/${id}/`, {rating: String(rate)})
            .then(response => {
                api.get(`/recipe/details/${id}/`)
                    .then((response) => {
                        setRating(response.data.rating);
                        toast.success('Rating added')
                    });
                toggleCanvas();
            })
            .catch(error => {
                console.error('Error adding rating', error);
            });
    }

    const handleSubmit = event => {
        event.preventDefault();
        api.post(`/recipe/comment/${id}/`, {
            text: comment,
            attachments: selectedFiles.map(attachment => ({attachment: attachment})),
            headers: {
                'Content-Type': "application/json"
            }
        })
            .then(response => {
                api.get(`/recipe/all-comments/${id}/`)
                    .then((response) => {
                        setallcomment(response.data);
                        setComment("");
                    });
            })
    };

    function buildCarusel() {
        return (
            attachments.map((img, index) => (
                <Carousel.Item>
                    <img
                        className="d-block img-fluid"
                        src={img.includes('/recipe/preview_picture') ? `http://127.0.0.1:8000${img}` : img}
                        style={{"height": "220px"}}
                        alt={index}
                    />
                </Carousel.Item>
            ))
        )
    }

    function getAttachments() {
        if (attachments && attachments.length > 0) {
            return (
                <div className="card mt-3">
                    <div className="card-header border-bottom my-n1">
                        <h4
                            style={{
                                "marginTop": "-5px",
                                "marginBottom": "-6px",
                                "marginLeft": "-7px",
                            }}>
                            Attachments
                        </h4>
                    </div>

                    <Carousel controls={false}>
                        {buildCarusel()}
                    </Carousel>

                </div>
            );
        }
        return (
            <>
            </>
        )
    }

    return (
        <div>
            <div className="container-xxl flex-grow-1 container-p-y">
                <h4>View Recipe</h4>
                <div className="row">
                    <div className="col-lg-9 card py-3 px-0">
                        <div className="border-bottom mb-4">
                            <div className="d-flex">
                                <h5 className="px-4">{recipeName}</h5>
                                <div className="ms-auto mt-1 me-3">
                                    <button type="button" className="btn waves-effect p-0" data-bs-toggle="offcanvas"
                                            data-bs-target="#offcanvasEnd" aria-controls="offcanvasEnd"
                                            onClick={toggleCanvas}>
                                        <span className="ti ti-star"></span>
                                    </button>
                                    <small>{rating}</small>
                                    <button type="button" className="btn waves-effect p-0"
                                            onClick={FavoriteButtonClick}>
                                        <span className={`ti ${isFavorite ? 'ti-bookmark' : 'ti-bookmark-off'}`}></span>
                                    </button>
                                    <small>{numfavs}</small>
                                </div>
                                <Offcanvas direction="end" isOpen={canvasOpen} toggle={toggleCanvas}>
                                    <OffcanvasHeader toggle={toggleCanvas}>Rating</OffcanvasHeader>
                                    <OffcanvasBody>
                                        <div className="mx-0 flex-grow-0 h-100">
                                            <div
                                                className="align-items-center justify-content-center d-flex flex-column h-100">
                                                <h4>Add a Rating</h4>
                                                <div className="mb-4">
                                                    <Container>
                                                        {[...Array(5)].map((item, index) => {
                                                            const givenRating = index + 1;
                                                            return (
                                                                <label>
                                                                    <Radio
                                                                        type="radio"
                                                                        value={givenRating}
                                                                        onClick={() => {
                                                                            setRate(givenRating);
                                                                        }}
                                                                    />
                                                                    <Rating>
                                                                        <FaStar
                                                                            color={
                                                                                givenRating < rate || givenRating === rate
                                                                                    ? "rgb(255, 165, 0)"
                                                                                    : "rgb(192,192,192)"
                                                                            }
                                                                        />
                                                                    </Rating>
                                                                </label>
                                                            );
                                                        })}
                                                    </Container>
                                                </div>
                                                <div className="w-75 card p-2">
                                                    <button type="button"
                                                            className="btn btn-primary waves-effect waves-light m-1"
                                                            onClick={SaveRating}>
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </OffcanvasBody>
                                </Offcanvas>
                            </div>
                        </div>
                        <div className="px-4">
                            <div className="row mb-3">
                                <div className="col-lg-4">
                                    <div><h6>Creator: {creatorName}</h6></div>
                                </div>
                                <div className="col-lg-4">
                                    <div><h6 className="d-inline-block me-1">Cuisine:</h6>{cuisineName}</div>
                                </div>
                                <div className="col-lg-4">
                                    <div><h6 className="d-inline-block me-1">Prep Time: </h6>{preptime}</div>
                                </div>
                                <div className="col-lg-4">
                                    <div>
                                        <h6 className="d-inline-block me-1">Diets:</h6>
                                        {diet.length > 0 ? diet.map((diet) => diet.name).join(", ") : "No diets selected"}
                                        {/*{diet.map((item, index) => (*/}
                                        {/*    <React.Fragment key={index}>*/}
                                        {/*        {item}*/}
                                        {/*        {index !== diet.length - 1 && ', '}*/}
                                        {/*    </React.Fragment>*/}
                                        {/*))}*/}
                                    </div>
                                </div>
                                <div className="col-lg-4">
                                    <div className='d-flex'>
                                        <h6 className="me-2">Serving:</h6> <input type="number"
                                                                                  className="form-control form-control-sm w-px-75 h-px-20"
                                                                                  value={serving}
                                                                                  onChange={handleServingChange}
                                                                                  min="1"/>
                                    </div>
                                </div>
                                <div className="col-lg-4">
                                    <div><h6 className="d-inline-block me-1">Cooking Time: </h6>{cookingTime}</div>
                                </div>
                            </div>
                        </div>
                        <table className="table table-striped mb-2">
                            <thead className="table-light">
                            <tr>
                                <th>Ingredient Name</th>
                                <th>Quantity/Amount</th>
                            </tr>
                            </thead>
                            <tbody className="table-border-bottom-0">
                            {ingredientList.map(i => (
                                <Ingredients name={i.name} quantity={i.quantity}/>
                            ))}
                            </tbody>
                        </table>
                        <div className="recipe_card_padding">
                            <h4 className="p-4 text-center mb-0">Steps</h4>
                            <div className="mb-4 px-4">
                                {parse(step)}
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3">
                        {getloggedindiv()}
                        <div className="col app-chat-history card overflow-hidden">
                            <div className="chat-history-wrapper mt-3 ms-3"><h4>Comments</h4></div>
                            <div className="chat-history-header border-bottom"></div>
                            <div className="chat-history-body bg-body ps ps--active-y h-400 chatHeight"
                                 style={{overflowY: "scroll", "minHeight": "312px"}}>
                                <ul className="list-unstyled chat-history m-3">
                                    {allcomment.map(c => (
                                        <Comments date_created={c.date_created} avatar={c.user_full_name.avatar} text={c.text}
                                                  full_name={c.user_full_name.full_name} attachments={c.attachments}/>
                                    ))}
                                </ul>
                            </div>
                            {getCommentAbility()}
                        </div>
                        {getAttachments()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ViewRecipe