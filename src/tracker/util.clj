(ns tracker.util
  (:use [clojure.java.io :only [resource]]) 
  (:require [clojure.string :as str]))

(defn serve-static [res]
  (slurp (resource (str "public/" res))))
 
(defn map-rows [f coll n row-class]
  (map (fn [els-in-row]
         [:div {:class row-class}
          (map f els-in-row)])
       (partition n n nil coll))) 

(defn display-flash [flash]
  (if-let [[type msg] flash]
    [:div {:class (str "alert alert-" (name type))} msg]))
     ;[:button {:type "button" :class "close" :data-dismiss "alert"} "×"]

(defn form-row [{:keys [label name type value input]}]

  (let [name (or name (str/lower-case (str/replace label " " "-"))) 
        type (or type "text")
        id (str "input-" name)]
    [:div {:class "control-group"}
     [:label {:class "control-label" :for id} label]
     [:div {:class "controls"}
      (or input [:input {:type type :name name :id id :value value}])]]))

