(ns tracker.views.diet.meal
  (:require [tracker.views.common :as common])
    (:use [noir.core :only [defpage defpartial]]
          [hiccup.page :only [html5]]
          [noir.fetch.remotes :only [defremote]]
          [clj-time.local :only [local-now]]
          [clj-time.format :only [unparse formatter-local]]
          [tracker.models.diet :only [meal-name]]
          [tracker.views.diet.food :only [food-modal]]
          [tracker.util :only [form-row]]))

(defpartial food-input [n]
  [:div {:class "food-input input-append"}
   [:input {:id (str "fti" n) :class "food-text-input" :type "text" :name "foods[]"}] 
   [:a {:class "btn" :onclick (format "tracker.diet.food.showModal(%s)" n)} 
       [:i {:class "icon-th"}]] 
   [:a {:id (str "pop-btn" n) :class "btn popover-btn" :onclick (format "tracker.diet.meal.quantityPopover(%s)" n)} 
       [:i {:class "icon-resize-vertical"}]]])

(defremote food-text-input [n]
  (food-input n))

(defpartial form-buttons []
  [:div {:id "form-buttons"}
   [:a {:id "add-food-btn" :class "btn" :onclick "tracker.diet.meal.addFoodInput(1)"} "Add Food"]
   [:button {:id "submit-meal-btn" :class "btn btn-primary" :type "submit"} "Submit Meal"]])

(def timepicker-formatter (formatter-local "MM/dd/YYYY hh:mm"))

(defpage [:get "/diet/new-meal"] []
  (common/layout 
    {:js ["/js/jquery-ui-timepicker-addon.js"]
     :css ["/css/timepicker.css"
           "/css/food.css"]}
    [:h2 "Create a New Meal"]
    (food-modal)
    [:form {:class "form-horizontal"}
     (form-row {:label "Meal Name" :value (meal-name (local-now))})
     (form-row {:label "Datetime" :value (unparse timepicker-formatter (local-now))})
     (form-row {:label "Foods" :name "foods[]" :input (food-input 0)})
     (form-buttons)]))

(defpage [:get "/diet/new-text-meal"] []
  (common/layout {}
    [:h1 "Diet"]
    [:h3 "Enter a New Meal by Text"]
    [:p "Enter one food per line:"]
    [:form
     [:textarea {:type "text" :id "meal-text-input" :class "span4"}]]))
