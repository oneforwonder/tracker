(ns tracker.views.diet.analysis
    (:use [noir.core :only [defpage defpartial]]))

(defpartial food-analysis []
  [:div {:class "food-analysis"}
   [:h3 "Food Analysis"]
   [:p "You used to eat really bad.  Now you're eating slightly better."]])

