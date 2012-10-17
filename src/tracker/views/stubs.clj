(ns tracker.views.stubs
  (:require [tracker.views.common :as common])
  (:use [noir.core]
        [hiccup.core :only [html]]))

(defpage "/todo" []
  (common/layout {}
    [:h1 "Todo"]
    [:h3 "Tasks:"]
    [:ul
     [:li "Improve Tracker"]]))

(defpage "/financial" []
  (common/layout {}
    [:h1 "Financial"]
    [:p "Make some money. Buy some things."]))

(defpage "/programming" []
  (common/layout {}
    [:h1 "Programming"]
    [:p "TODO: This page"]))

(defpage "/music" []
  (common/layout {}
    [:h1 "Music"]
    [:p "Write the next great electronic rock opera."]))

(defpage "/mind" []
  (common/layout {}
    [:h1 "Mind"]
    [:p "Read a book."]))

(defpage "/mind" []
  (common/layout {}
    [:h1 "Mind"]
    [:p "Read a book."]))

(defpage "/social" []
  (common/layout {}
    [:h1 "Social"]
    [:p "Talk to someone."]))
