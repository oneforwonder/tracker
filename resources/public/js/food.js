function loadFoods(page)
{
  $("#foods-grid").load("/diet/food-group/" + page);
}

function selectFood(food)
{
  $("#add-food-modal").modal('hide');
  $("#fti1").attr("value", "1 cup " + food);
} 

function displayPopover() {
  $(".popover-btn").popover('show', {title: "Quantity", content: "Pop!"});
}

$(window).bind("load", function() {
  $(".alert").alert();
  $(".popover-btn").popover({content: "Pop!", selector: ".popover-btn"});
});


