(ns tracker.views.diet.food
    (:require [clojure.string :as str])
    (:use [hiccup.page :only [html5]]
          [tracker.models.diet :only [food-hierarchy]]))

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

(defpage "/diet/food-group/:fg" {:keys [fg]}
  (let [category (str/split fg #"_")
        foods    (get-in food-hierarchy (map str/capitalize category))]
    (html5 (food-grid category foods))))


;(defpartial add-a-food [meal category flash]
  ;[:h2 "Add a Food"]

  ;(display-flash flash)

  ;[:p {:class "lead"} (format "Add a food to %s meal" meal)]

  ;[:form {:id "new-food-form" :method "POST" :action "/diet/add-to-meal"}
   ;[:input {:id "meal-input" :type "hidden" :name "meal" :value meal}]
   ;[:input {:id "food-input" :type "hidden" :name "food"}]]

  ;[:div {:id "foods-grid" :class "span7"}
   ;(food-grid category (get-in food-hierarchy (map str/capitalize category)))])

;(defpage [:get "/diet/add-to-meal/:meal"] {:keys [meal]} 
  ;(common/layout 
    ;{:css ["/css/food.css"]
     ;:js  ["/js/food.js"]}
     ;(add-a-food meal ["food"] (flash-get))))

;(defpage [:post "/diet/add-to-meal"] {:keys [food meal]}
  ;(flash-put! [:success (format "Added %s to %s meal" food meal)])
  ;(redirect "/diet"))
