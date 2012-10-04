(ns tracker.models.diet)

(def food-hierarchy
  {"Food" (array-map
            "Fruit"      ["Apple"
                          "Orange"
                          "Banana"
                          "Grapes"
                          "Cherries"
                          "Watermelon"
                          "Peach"
                          "Blackberries"
                          "Strawberries"]
            "Vegetables" ["Carrot"
                          "Broccoli"
                          "Lettuce"]
            "Grains"     {"Rice" ["Brown Rice" 
                                  "White Rice"
                                  "Jasmine Rice"] 
                          "Quinoa" nil
                          "Barley" nil
                          "Rye"    nil} 
            "Meat"       []
            "Beans"      []
            "Dairy"      []
            "Beverages"  []
            "Packaged"   []
            "Homemade"   [])})

(defn meal-name [time]
  (condp > (hour time)
     4 "Midnight Snack"
     9 "Breakfast"
    12 "Brunch"
    15 "Lunch"
    17 "Afternoon Snack"
    20 "Dinner"
    24 "Late Night Snack"))

(def meals
 [["First Meal"
   "8:30 AM"
   ["1 large apple" "1 medium pear" "1 medium bear"]]
  ["Second Meal"
   "11:40 AM"
   ["1 cup oatmeal" "1 banana" "1 tbps sugar"]] 
  ["Third Meal"
   "1:45 PM"
   ["1 lb spaghetti" "1 herd cattle" "1 gallon tomato sauce" "Parsley"]]])

