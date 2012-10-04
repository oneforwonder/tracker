(ns tracker.views.diet.meal
  (:require [tracker.views.common :as common])
    (:use [hiccup.page :only [html5]]
          [clj-time.core :exclude [extend]]
          [clj-time.local :only [local-now]]
          [clj-time.format]
          [tracker.models.diet :only [meal-name]]
          [tracker.util :only [form-row]]))

(defn food-modal []
  [:div {:class "modal hide fade" :id "add-food-modal"}
   [:div {:class "modal-header"}
    [:button {:type "button" :class "close" :data-dismiss "modal" :aria-hidden "true"} "&times;"]
    [:h3 "Add Food"]]
   [:div {:class "modal-body"}
    [:div {:id "foods-grid"}
     (food-grid ["food"] (get-in food-hierarchy ["Food"]))]]])

(defpage "/diet/new-meal/quantity-slider" []
  (html5
    [:div {:class "quantity-slider"} 
     [:p {:id "quantity-readout" :style "margin-bottom: 8px;"} "1 cup"]
     [:div {:id "slider-vertical" :style "height:200px;"}]])) 

(defpartial food-input [n]
  [:div {:class "food-input input-append"}
   [:input {:id (str "fti" n) :class "food-text-input" :type "text" :name "foods[]"}] 
   [:a {:class "btn" :href "#add-food-modal" :role "button" :data-toggle "modal"} 
       [:i {:class "icon-th"}]] 
   [:a {:id (str "pb" n) :class "btn popover-btn" :onclick (format "quantityPopover(%s)" n)} 
       [:i {:class "icon-resize-vertical"}]]])

(defpage "/diet/new-meal/food-input/:n" {:keys [n]} 
  (food-input n))

(defpartial form-buttons []
  [:div {:id "form-buttons"}
   [:a {:id "add-food-btn" :class "btn" :onclick "tracker.diet.new_meal.add_food_input(1)"} "Add Food"]
   [:button {:id "submit-meal-btn" :class "btn btn-primary" :type "submit"} "Submit Meal"]])

(def timepicker-formatter (formatter-local "MM/dd/YYYY hh:mm"))

(defpage [:get "/diet/new-meal"] []
  (common/layout 
    {:js ["/js/jquery-ui-timepicker-addon.js"
          ;"/js/new-meal.js"
          "/js/food.js"]
     :css ["/css/timepicker.css"
           "/css/food.css"]}
    [:h2 "Create a New Meal"]
    (food-modal)
    [:form {:class "form-horizontal"}
     (form-row {:label "Meal Name" :value (meal-name (local-now))})
     (form-row {:label "Datetime" :value (unparse timepicker-formatter (local-now))})
     (form-row {:label "Foods" :name "foods[]" :input (food-input 0)})
     (form-buttons)]))
