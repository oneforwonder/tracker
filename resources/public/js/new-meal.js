function addFoodInput(n) {
    console.log("aFI");
    vals = $(".controls").val();
    $.ajax("/diet/new-meal/food-input/"+n, {success: function(data, s, j) {
        $(".controls").filter(":last").html(function(index, old) {
            return old + "<br />" + data;
        });
    }});
    for (i=0; i<vals.; i++) {

    }
    $("#add-food-btn").attr("onclick", "addFoodInput("+(n+1)+")");
}

function quantitySlider() {
    req = $.ajax("/diet/new-meal/quantity-slider", {async: false});
    return req.responseText
}

function updateQuantity(ftin, nq) {
    fti = $("#fti" + ftin)
    fti.val(nq + "  " + fti.val().split("  ")[1]);
}

function indexToQuantity(i) {
    return {0: "1 tbsp",
            1: "1/4 cup",
            2: "1/2 cup",
            3: "1 cup"}[i];
}

function quantityToIndex(q) {
    return {"1 tbsp":  0,
            "1/4 cup": 1,
            "1/2 cup": 2,
            "1 cup":   3}[q];
}

var popped = false;
function quantityPopover(n) {
    console.log("in qP " + n);
    if (popped) { 
        popped = false;
        $("#pb"+n).popover("destroy"); 
    }
    else {
        popped = true;
        pb = $("#pb"+n);
        pb.popover({title: "Quantity", content: quantitySlider()});
        pb.popover("show");
        setTimeout(function(){
            $("#quantity-readout").html($("#fti"+n).val().split("  ")[0]);
            $("#slider-vertical").slider({
                orientation: "vertical",
                min: 0,
                max: 3,
                value: quantityToIndex($("#fti"+n).val().split("  ")[0]),
                slide: function(event, ui) {
                    $("#quantity-readout").html(indexToQuantity(ui.value));
                },
                change: function(event, ui) {
                    updateQuantity(n, indexToQuantity(ui.value));
                    $("#pb"+n).popover("destroy");
                }
            });
        }, 200);
    }
}


$(window).bind("load", function() {
  $("#input-datetime").datetimepicker();
});

