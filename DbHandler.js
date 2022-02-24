const db = require("better-sqlite3")('./db/exercises.db');

var _ = require('lodash');

const tableCreation = 'create table if not exists exercises(' +
                        'exercise_id integer primary key autoincrement,' + 
                        'title text not null,' +
                        'author text not null,' +
                        'faculty text not null,' +
                        'fileName text not null);';

db.exec(tableCreation);



/**
 * Adds a newly created exercise to the database
 * @param {string} title The title of the exercise
 * @param {string} author The author of the exercise
 * @param {string} faculty The faculty responsible for the exercise
 * @param {string} fileName The file path of the exercise
 */
exports.addExercise = function(title, author, faculty, fileName)
{
    if(!_.isString(title) || !_.isString(author) || !_.isString(faculty) || !_.isString(fileName))
    {
        throw new TypeError("Expected string, got something else.");
    }

    let stmt = db.prepare('INSERT INTO exercises (title, author, faculty, fileName) VALUES(@title, @author, @faculty, @fileName)');

    stmt.run({
        title: title,
        author: author,
        faculty: faculty,
        fileName: fileName
    });
}

/**
 * Returns true if there is already a file with the same name in the database, returns false if not.
 * @param {string} fileName The name of a file to be checked for duplicates
 * @returns {boolean} Whether or not there is a duplicate file
 */
exports.duplicate = function(fileName)
{
    if(!_.isString(fileName))
    {
        throw new TypeError("Expected string, got " + typeof(fileName));
    }

    let duplicates = db.prepare('select * from exercises where fileName = ?').all(fileName);

    if(duplicates.length)
    {
        return true;
    }
    return false;
}

/**
 * Returns the file path of the id with the given exercise
 * @param {number} id The id of the exercise to fetch the file path of
 * @returns {string|false} The file path of the exercise with the given id, or false
 */
exports.getExerciseFileName = function(id)
{
    if(!_.isInteger(id))
    {
        throw new TypeError("Expected integer, got " + typeof(id));
    }
    try
    {
        let fileName = db.prepare('select fileName from exercises where exercise_id = ?').get(id);

        if(fileName)
        {
            return fileName;
        }
    
        return false;
    }
    catch(e)
    {
        console.log(e);
        return false;
    }
}

/**
 * Returns the exercise with the given id
 * @param {number} id The id of the exercise to fetch
 * @returns {exercise | false} The exercise with the given id, or, if it doesn't exist or an error occurs, false.
 */
exports.getExercise = function(id)
{
    if(!_.isInteger(id))
    {
        throw new TypeError("Expected integer, got " + typeof(id));
    }

    try
    {
        let exercise = db.prepare('select * from exercises where exercise_id = ?').get(id);

        if(exercise)
        {
            return exercise;
        }

        return false;
    }
    catch(e)
    {
        console.log(e);
        return false;
    }
}

/**
 * Returns the list of saved exercises
 * @returns {exercise[] | false}
 */
exports.getList = function()
{
    try
    {
        let exercises = db.prepare('select * from exercises').all();

        return exercises;
    }
    catch(e)
    {
        console.log(e);
        return false;
    }
}

/**
 * Returns the list of saved exercises, without file names for the application
 * @returns {exercise[] | false}
 */
 exports.getAppList = function()
 {
     try
     {
         let exercises = db.prepare('select exercise_id as Exercise_Id, title as Title, author as Author, faculty as Faculty from exercises').all();
 
         return exercises;
     }
     catch(e)
     {
         console.log(e);
         return false;
     }
 }

/**
 * Deletes the exercise with the given ID
 * @param {number} id The ID of the exercise to be deleted
 * @returns {RunResult | false}
 */
exports.deleteExercise = function(id)
{
    if(!_.isInteger(id))
    {
        throw new TypeError("Expected integer, got something else");
    }

    try
    {
        let removal = db.prepare('delete from exercises where exercise_id = ?').run(id);
        return removal;
    }
    catch(e)
    {
        console.log(e);
        return false;
    }
}