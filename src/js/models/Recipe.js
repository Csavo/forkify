/**
* Recipe controller
*/

import axios from 'axios';
import { key, proxy } from '../config';

export default class Recipe {
    constructor(id) {
        this.id = id;
    }

    async getRecipe() {
        try {
            const res = await axios(`${proxy}http://food2fork.com/api/get?key=${key}&rId=${this.id}`);
            this.title = res.data.recipe.title;
            this.author = res.data.recipe.publisher;
            this.img = res.data.recipe.image_url;
            this.url = res.data.recipe.source_url;
            this.ingredients = res.data.recipe.ingredients;
        } catch(error) {
            alert(`Recipes Error! ${error}`);
        }
    }

    calcTime() {
        // Assuming we need 15 minutes for every 3 ingredient
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng / 3);
        this.time = periods * 15;
    }

    calcServings() {
        this.servings = 4; // LUL
    }

    parseIngredients() {
        const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoons', 'teaspoon', 'cups', 'pounds'];
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound'];
        const unitsAll = [...unitsShort, 'kg', 'g'];
        const newIngredients = this.ingredients.map(el => {
            // 1) uniform units
            let ingredient = el.toLowerCase();
            unitsLong.forEach((unit, i) => {
                ingredient = ingredient.replace(unit, unitsShort[i]);
            });
            // 2) remove ()
            ingredient = ingredient.replace(/ *\([^)]*\)*/g, '');

            // 3) parse ingredients into count, unit, ingredients
            const ingArr = ingredient.split(' ');
            const unitIndex = ingArr.findIndex(el2 => unitsAll.includes(el2));

            let ingObj;
            if (unitIndex > -1) { // There is a unit
                const arrCount = ingArr.slice(0, unitIndex); // Ex: 1 1/2 cups => arrCount = [1, 1/2]
                let count;
                if (arrCount.length === 1) {
                    count = eval(ingArr[0].replace('-', '+'));
                } else {
                    count = eval(ingArr.slice(0, unitIndex).join('+'));
                }
                ingObj = {
                    count, // same as count: count
                    unit: ingArr[unitIndex],
                    ingredient: ingArr.slice(unitIndex + 1).join(' ')
                }
            } else if (parseInt(ingArr[0], 10)) { // There is NO unit, but 1st element is a number
                ingObj = {
                    count: parseInt(ingArr[0], 10),
                    unit: '',
                    ingredient: ingArr.slice(1).join(' ')
                }
            } else if (unitIndex === -1) { // There is NO unit, and NO number on first position
                ingObj = {
                    count: 1,
                    unit: '',
                    ingredient // same as: ingredient: ingredient
                }
            }

            return ingObj;
        });
        this.ingredients = newIngredients;
    }

    updateServings(type) {
        const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1;
        this.ingredients.forEach(ing => {
            ing.count *= (newServings / this.servings);
        });
        this.servings = newServings;
    }
}