(ns tracker.diet.meal
    (:use [goog.string :only [format]]
          [tracker.util :only [log reverse-map]])
    (:use-macros [crate.def-macros :only [defpartial]]
                 [fetch.macros :only [letrem]])
    (:require [clojure.string :as str]
              [crate.core :as crate]
              [fetch.remotes :as remotes]
              [jayq.core :as jq]
              [tracker.bootstrap :as bs]))

;; Add food input
(defn ^:export addFoodInput [n]
  (letrem [fti (food-text-input n)]
    (jq/append (jq/$ ".controls:last") (str "<br />" fti)))
  (jq/attr (jq/$ "#add-food-btn") "onclick" 
           (format "tracker.diet.meal.addFoodInput(%d)" (inc n))))


;; Quantity popover
(def i-to-q
     {0 "1 tbsp"
      1 "1/4 cup"
      2 "1/2 cup"
      3 "1 cup"})

(def q-to-i (reverse-map i-to-q))

(def popped (atom {}))

(defn destroy-popover! [n]
  (swap! popped assoc n false)
  (bs/popover (jq/$ (str "#pop-btn" n)) "destroy"))

(defpartial slider []
  [:div {:class "quantity-slider"} 
     [:p {:id "quantity-readout"} ""]
     [:div {:id "slider-vertical"}]])

(defn fti [n]
  (jq/$ (str "#fti" n)))

(defn fti-quantity-food [n]
  (-> (fti n)
      (jq/val)
      (str/split #"  ")))

(defn fti-quantity [n]
  (first (fti-quantity-food n)))

(defn fti-food [n]
  (second (fti-quantity-food n)))

(defn update-fti-quantity! [n q]
  (jq/val (fti n) (str q "  " (fti-food n))))

(defn create-popover! [n]
  (swap! popped assoc n true)
  (let [pb (jq/$ (str "#pop-btn" n))
        quantity (fti-quantity n)]
    (bs/popover pb {:title "Quantity" :content (slider)})
    (bs/popover pb "show")
    (jq/inner (jq/$ "#quantity-readout") quantity)
    (.slider (jq/$ "#slider-vertical")
             (js-obj "orientation" "vertical",
                     "min" 0,
                     "max" 3,
                     "value" (q-to-i quantity) 
                     "slide" (fn [event ui] 
                                (jq/inner (jq/$ "#quantity-readout")
                                          (i-to-q (.-value ui)))),
                     "change" (fn [event ui]
                                 (update-fti-quantity! n (i-to-q (.-value ui)))
                                 (destroy-popover! n))))))

(defn ^:export quantityPopover [n]
  (if (@popped n)
    (destroy-popover! n)
    (create-popover! n)))
