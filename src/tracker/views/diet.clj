(ns tracker.views.diet
  (:require [tracker.views.common :as common]
            [clojure.string :as str])
  (:use [noir.core :only [defpartial defpage]]
        [noir.response :only [redirect]]
        [noir.session :only [flash-put! flash-get]]
        [hiccup.page-helpers :only [html5]]
        [clj-time.core :exclude [extend]]
        [clj-time.local :only [local-now]]
        [clj-time.format]
        [tracker.util]))

;; Add food to a meal
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

(defn onclick-food [food] 
  (format "selectFood('%s')" food))

(defn onclick-category [category]
  (format "loadFoods('%s')" (str/join "_" category)))

(defn food-img-path [category food]
  (str/lower-case (format "/img/%s/%s.png" (str/join "/" category) food)))

(defpartial food-btn [category food-entry]
  (let [[food leaf?] (if (= (count food-entry) 2)
                       [(key food-entry) (nil? (val food-entry))] 
                       [food-entry true])
        img-path (food-img-path category food)
        onclick  (if leaf?
                   (onclick-food food)
                   (onclick-category (concat category [food])))]
  [:a {:class "btn food-btn span4" :onclick onclick}
   [:img {:class "food-img" :width 64 :src img-path} food]]))

(defpartial food-breadcrumb [category]
  [:span {:id "food-breadcrumb"}
   (map (fn [cs]
          [:a {:class "food-breadcrumb" :href "#" :onclick (onclick-category cs)} 
              (str/capitalize (last cs)) 
              [:small [:i {:class "icon-chevron-right"}]]])
        (drop 1 (reductions conj [] category)))])

(defpartial food-grid [category foods]
   (food-breadcrumb category)
   (map-rows (partial food-btn category) foods 3 "row-fluid"))

(defpartial add-a-food [meal category flash]
  [:h2 "Add a Food"]

  (display-flash flash)

  [:p {:class "lead"} (format "Add a food to %s meal" meal)]

  [:form {:id "new-food-form" :method "POST" :action "/diet/add-to-meal"}
   [:input {:id "meal-input" :type "hidden" :name "meal" :value meal}]
   [:input {:id "food-input" :type "hidden" :name "food"}]]

  [:div {:id "foods-grid" :class "span7"}
   (food-grid category (get-in food-hierarchy (map str/capitalize category)))])

(defpage [:get "/diet/add-to-meal/:meal"] {:keys [meal]} 
  (common/layout 
    {:css ["/css/food.css"]
     :js  ["/js/food.js"]}
     (add-a-food meal ["food"] (flash-get))))

(defpage [:post "/diet/add-to-meal"] {:keys [food meal]}
  (flash-put! [:success (format "Added %s to %s meal" food meal)])
  (redirect "/diet"))

(defpage "/diet/food-group/:fg" {:keys [fg]}
  (let [category (str/split fg #"_")
        foods    (get-in food-hierarchy (map str/capitalize category))]
    (html5 (food-grid category foods))))


;; Create a new meal
(defn meal-name [time]
  (condp < (hour time)
     4 "Midnight Snack"
     9 "Breakfast"
    12 "Brunch"
    15 "Lunch"
    17 "Afternoon Snack"
    20 "Dinner"
    24 "Late Night Snack"))

(defn food-modal []
  [:div {:class "modal hide fade" :id "add-food-modal"}
   [:div {:class "modal-header"}
    [:button {:type "button" :class "close" :data-dismiss "modal" :aria-hidden "true"} "&times;"]
    [:h3 "Add Food"]]
   [:div {:class "modal-body"}
    [:div {:id "foods-grid"}
     (food-grid ["food"] (get-in food-hierarchy ["Food"]))]]])

(defn quantity-popover []
  [:div {:class "popover"} 
   [:p "Pop!"]])

(defn food-input []
  [:div {:class "input-append"}
   [:input {:id "fti1" :class "food-text-input" :type "text" :name "foods[]"}] 
   [:button {:class "btn" :href "#add-food-modal" :role "button" :data-toggle "modal" } [:i {:class "icon-th"}]] 
   [:button {:class "btn popover-btn" :onclick "displayPopover()" } [:i {:class "icon-resize-vertical"}]]])

(def timepicker-formatter (formatter-local "MM/dd/YYYY hh:mm"))

(defpage [:get "/diet/new-meal"] []
  (common/layout 
    {:js ["/js/jquery-ui-timepicker-addon.js"
          "/js/new-meal.js"
          "/js/food.js"]
     :css ["/css/timepicker.css"
           "/css/food.css"]}
    [:h2 "Create a New Meal"]
    (food-modal)
    (quantity-popover)
    [:form {:class "form-horizontal"}
     (form-row {:label "Meal Name" :value (meal-name (local-now))})
     (form-row {:label "Datetime" :value (unparse timepicker-formatter (local-now))})
     (form-row {:label "Foods" :name "foods[]" :input (food-input)})
     (form-row {:label "" :name "submit" :input [:button {:class "btn btn-primary" :type "submit"} "Submit Meal"]}) ] 
   
    ))

;; Today's Food
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

(defpartial food-today [flash]
  [:div {:class "food-today"}
   [:h3 "Today's Food"]
   (display-flash flash)
   [:div {:class "meal-grid"}
    (map-rows (partial apply meal-card) meals 2 "row")]
   [:a {:class "btn btn-primary add-meal-btn" :href "/diet/new-meal"} "Add a Meal"]])

(defpartial food-analysis []
  [:div {:class "food-analysis"}
   [:h3 "Food Analysis"]
   [:p "You used to eat really bad.  Now you're eating slightly better."]])

(defpage "/diet" []
  (common/layout {}
    [:h1 "Diet"]
    (food-today (flash-get))
    (food-analysis)))
