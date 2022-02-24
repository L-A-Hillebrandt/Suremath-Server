function deleteExercise(id)
{
    fetch("/list/" + id, {method: 'DELETE'})
    .then(response=>{
        if(response.ok)
        {
            window.location.reload();
        }
    });
}