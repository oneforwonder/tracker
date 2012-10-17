(ns tracker.diet.food
    (:use [tracker.util :only [log]])
    (:use-macros [crate.def-macros :only [defpartial]]
                 [fetch.macros :only [letrem]])
    (:require [clojure.string :as str]
              [crate.core :as crate]
              [fetch.remotes :as remotes]
              [domina :as d]
              [jayq.core :as jq]
              [tracker.bootstrap :as bs]))

(defn ^:export loadFoods [fg]
  (letrem [grid (food-group (str/split fg #"/"))]
    (jq/inner (jq/$ "#food-grid") grid)
    ;(d/swap-content! (d/by-id "food-grid") grid)
    ))

(def current-input (atom 0))

(defn ^:export showModal [n]
  (reset! current-input n)
  (bs/modal 
    (jq/$ "#add-food-modal")
    ;(d/by-id "add-food-modal")
    "show"))

(defn ^:export selectFood [food]
  (bs/modal 
    ;(jq/$ "#add-food-modal") 
    (d/by-id "add-food-modal")
    "hide")
  (loadFoods "food")
  (jq/attr 
    (jq/$ (str "#fti" @current-input))
    ;(d/by-id (str "fti" @current-input))
    "value" (str "1 cup  " food)))
