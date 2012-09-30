(ns tracker.views.nutrition
  (:require [tracker.views.common :as common])
  (:use [noir.core]
        [hiccup.core :only [html]]))

(defpartial meal-card [title t-o-d foods]
  [:div {:class "meal span3"}
    [:div {:class "meal-header"}
      [:h4 title " " [:small t-o-d]]
      [:div {:class "btn-toolbar meal-header-btns"}
        [:div {:class "btn-group"} 
          [:a {:class "btn btn-small" :href "#add-to-meal-1"} [:i {:class "icon-plus"}]]
          [:a {:class "btn btn-small" :href "#edit-meal-1"} [:i {:class "icon-wrench"}]]]]]
    [:div {:class "meal-items"}
      [:ul
        (map (fn [food] [:li food]) foods)]]])

(defpage "/diet" []
  (common/layout
    [:h1 "Diet"]
    [:div {:class "food-today"}
     [:div {:class "meal-grid"}
      [:div {:class "row"}
       (meal-card
         "First Meal"
         "8:30 AM"
         (list "1 large apple" "1 medium pear" "1 medium bear"))
       (meal-card
         "Second Meal"
         "11:40 AM"
         (list "1 cup oatmeal" "1 banana" "1 tbps sugar"))] 

      [:div {:class "row"}
       (meal-card
         "Third Meal"
         "1:45 PM"
         (list "1 lb spaghetti" "1 herd cattle" "1 gallon tomato sauce" "Parsley")) 
       (meal-card 
         "Fourthmeal"
         "1:13 AM"
         (list "Grande Enchurrito" "Grande Loco Burritadilla" "Venti Coca-Slice"))] 

      [:div {:class "row"}
       (meal-card
         "Snack One"
         "2:00 PM"
         (list "Pringles" "Pringles" "Pringles - Extra Ranch")) 
       (meal-card
         "Snack Two"
         "2:07 PM"
         (list "1/2 herd buffalo" "1/2 Mark Ruffalo" "BBQ Sauce" "Dunst to taste"))]]]

    [:a {:class "btn btn-primary add-meal-btn" :href "#create-meal"} "Add a Meal"] 
    [:div {:class "food-analysis"}
     [:h3 "Food Analysis"]
     [:p "You used to eat really bad.  Now you're eating slightly better."]]))
