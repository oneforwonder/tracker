(ns tracker.views.welcome
  (:require [tracker.views.common :as common]
            [tracker.views.boilerplate :as bp]
            [tracker.views.nutrition :as nc]
            [noir.content.getting-started])
  (:use [noir.core]
        [hiccup.core :only [html]]))

(def judgements
  {:Great  "judgement text-success"
   :Okay   "judgement text-success"
   :Improveable "judgment text-error"})

(defpartial overview-box [category bg text j]
  [:div {:class bg}
    [:h3 category]
    [:p text]
    [:p "Rating: "
      [:span {:class (j judgements)} (name j)]]])

(defpage "/overview" []
  (common/layout
    [:div {:class "row"}
      (bp/sidebar)

      [:div {:class "span9 content"}
        [:h1 "Tracker Overview"]
        [:p {:class "lead"} 
          "Overall you're doing "
          [:span {:class "judgement text-success"} "okay"]
          " today."]

        (overview-box
          "To-Do"
          "category-overview pale-green-bg"
          "Your to-do list is empty!  Enjoy your free time."
          :Great)
    
        (overview-box
          "Diet"
          "category-overview pale-blue-bg"
          "Today, you've eaten decently - not bad!  I bet you'll do even better tomorrow."
          :Okay)

        (overview-box
          "Exercise"
          "category-overview pale-green-bg"
          "Your exercise for today is done AND you've set a new personal record!"
          :Great)

        (overview-box
          "Financial"
          "category-overview pale-blue-bg"
          "You're broke, champ.  Make more money pronto.  Maybe sell some extra organs?"
          :Improveable)]]))

(defpage "/diet" []
  (common/layout
    [:div {:class "row"}
      (bp/sidebar)
      [:div {:class "span9 content"}
        [:h1 "Diet"]
        [:div {:class "food-today"}
          [:div {:class "meal-grid"}
            [:div {:class "row"}
             (nc/meal-card
               "First Meal "
               "8:30 AM"
               (list "1 large apple" "1 medium pear" "1 medium bear"))
             (nc/meal-card
               "Second Meal "
               "11:40 AM"
               (list "1 cup oatmeal" "1 banana" "1 tbps sugar"))
             (nc/meal-card
               "Third Meal "
               "1:45 PM"
               (list "1 lb spaghetti" "1 herd cattle" "1 gallon tomato sauce" "Parsley"))
             (nc/meal-card 
               "Fourthmeal "
               "1:13 AM"
               (list "Grande Enchurrito" "Grande Loco Burritadilla" "Venti Coca-Slice"))
             (nc/meal-card
               "Snack One"
               "2:00 PM"
               (list "Pringles" "Pringles" "Pringles - Extra Ranch"))
             (nc/meal-card
               "Snack Two"
               "2:07 PM"
               (list "1/2 herd buffalo" "1/2 Mark Ruffalo" "BBQ Sauce" "Dunst to taste"))]]]

      [:a {:class "btn btn-primary add-meal-btn" :href "#create-meal"} "Add a Meal"] 
      [:div {:class "food-analysis"}
        [:h3 "Food Analysis"]
        [:p "You used to eat really bad.  Now you're eating slightly better."]]]]))
