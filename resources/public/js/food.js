function loadFoods(page)
{
  $("#foods-grid").load("/diet/food-group/" + page);
}

function selectFood(food)
{
  $("#add-food-modal").modal('hide');
  $("#fti1").attr("value", "1 cup  " + food);
  $("#foods-grid").load("/diet/food-group/food");
} 

