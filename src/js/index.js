/**
* Global App controller
*/

import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the app
* - Search object
* - Current recipe object
* - Shopping list object
* - Liked object
*/
const state = {};
// window.state = state; //  for TESTING

/**
* SEARCH controller
*/
const controlSearch = async () => {
    // 1) get query from view
    const query = searchView.getInput();
    
    if (query) {
        // 2) new search object and add to state
        state.search = new Search(query);
        
        // 3) prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchResults);
        
        try {
            // 4) search for recipes
            await state.search.getResults();
            
            // 5) render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch(error) {
            alert(`Error processing search results! ${error}`);
            clearLoader();
        }
    }
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

// adding event listeners for pagination buttons using event delegation
elements.searchResultPages.addEventListener('click', e => {
    // console.log(e.target); // shows the element we clicked on
    const btn = e.target.closest('.btn-inline'); // closest ancestor of the current element (or the current element itself) which matches the selectors given in parameter
    // console.log(btn);
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10); // reads the value from the data-* attribute (data-goto in this case)
        // console.log(goToPage);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/**
* RECIPE controller
*/
const controlRecipe = async () => {
    // get id from URL
    const id = window.location.hash.replace('#', '');
    //console.log(id);
    if (id) {
        // prepare ui for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);
        // highlight selected search item
        if (state.search) searchView.highlightSelected(id);
        // create recipe object
        state.recipe = new Recipe(id);
        
        try {
            // get recipe data and parse ingredients
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();
            // calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();
            // render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        } catch(error) {
            alert(`Error processing recipe! ${error}`);
        }
    }
};

// window.addEventListener('hashchange', controlRecipe);
// and
// window.addEventListener('load', controlRecipe);
// combined:
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
* SHOPPING LIST controller
*/
const controlList = () => {
    // Create new list of there is none yet
    if (!state.list) state.list = new List();

    // Add each ingredient to the list and the UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
}

/**
* LIKE controller
*/

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();

    const currentId = state.recipe.id;
    if (!state.likes.isLiked(currentId)) {
        // add the like to the state
        const newLike = state.likes.addLike(
            currentId,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // toggle the like button
        likesView.toggleLikeBtn(true);
        // add like to the UI list
        likesView.renderLike(newLike);
    } else {
        // remove the like from the state
        state.likes.deleteLike(currentId);
        // toggle the like button
        likesView.toggleLikeBtn(false);
        // remove like from the UI list
        likesView.deleteLike(currentId);
    }
    likesView.toggleLikeMenu(state.likes.getNumOfLikes());
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;
    // handle the delete button
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // delete from state
        state.list.deleteItem(id);
        // delete from UI
        listView.deleteItem(id);
    // handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }
});

// Handeling servings change event listeners with .matches();
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) { // Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) { // Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) { // Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) { // Like button
        controlLike();
    }
});

// Restore liked recipes on page load
window.addEventListener('load', () => {
    state.likes = new Likes();
    // restore likes
    state.likes.readStorage();
    // toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumOfLikes());
    // render existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});