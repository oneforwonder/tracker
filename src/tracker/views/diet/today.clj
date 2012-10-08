(ns tracker.views.diet.today
    (:require [tracker.views.common :as common])
    (:use [noir.core :only [defpartial defpage]]
          [tracker.models.diet :only [meals]]
          [tracker.util :only [map-rows]]))

(defpartial meal-card [title t-o-d foods]
  [:div {:class "meal span3"}
    [:div {:class "meal-header"}
      [:h4 title " " [:small t-o-d]]
      [:div {:class "btn-toolbar meal-header-btns"}
        [:div {:class "btn-group"} 
          [:a {:class "btn btn-small" :href (str "/diet/add-to-meal/" title) } [:i {:class "icon-plus"}]]
          [:a {:class "btn btn-small" :href (str "/diet/edit-meal/" title) }   [:i {:class "icon-wrench"}]]]]]
    [:div {:class "meal-items"}
      [:ul
        (map (fn [food] [:li food]) foods)]]])

(defpartial food-today []
  [:div {:class "food-today"}
   [:h3 "Today's Food"]
   [:div {:class "meal-grid"}
    (map-rows (partial apply meal-card) meals 2 "row")]
   [:a {:class "btn btn-primary add-meal-btn" :href "/diet/new-meal"} "Add a Meal"]])

(defpage "/diet" []
  (common/layout {}
    [:h1 "Diet"]
    (food-today)))
