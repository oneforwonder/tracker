(ns tracker.views.nutrition
  (:require [tracker.views.common :as common]
            [noir.content.getting-started])
  (:use [noir.core]
        [hiccup.core :only [html]]))

(defpartial meal-card [title t-o-d foods]
  [:div {:class "meal span3"}
    [:div {:class "meal-header"}
      [:h4 title [:small t-o-d]]
      [:div {:class "btn-toolbar meal-header-btns"}
        [:div {:class "btn-group"} 
          [:a {:class "btn btn-small" :href "#add-to-meal-1"} [:i {:class "icon-plus"}]]
          [:a {:class "btn btn-small" :href "#edit-meal-1"} [:i {:class "icon-wrench"}]]]]]
    [:div {:class "meal-items"}
      [:ul
        (map (fn [food] [:li food]) foods)]]])
