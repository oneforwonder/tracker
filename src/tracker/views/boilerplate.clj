(ns tracker.views.boilerplate
  (:require [tracker.views.common :as common]
            [noir.content.getting-started])
  (:use [noir.core]
        [hiccup.core :only [html]]))

(def sidebar-shit (array-map 
  :Overview    "#overview"
  :To-Do       "#todo"
  :Exercise    "#exercise"
  :Financial   "#financial"
  :Diet        "#diet"
  :Programming "#programming"
  :Music       "#music"
  :Mind        "#mind"
  :Social      "#social"))

(defpartial sidebar []
  [:div {:class "span3"}
    [:ul {:class "nav nav-tabs nav-stacked sidenav"}
      (map 
        (fn [thing]
          [:li
            [:a {:href (thing sidebar-shit)}
              [:i {:class "icon-chevron-right"}]
              (name thing)]])
        (keys sidebar-shit))]])
