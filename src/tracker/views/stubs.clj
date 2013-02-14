(ns tracker.views.stubs
  (:require [tracker.views.common :as common])
  (:use [noir.core]
        [hiccup.core :only [html]]))

(defpage "/todo" []
  (common/layout {}
    [:h1 "Todo"]
    [:h3 "Today"]
    [:ul
     [:li {:class "todo-done"} "Find a way to view multiple email inboxes"]   
     [:li "Improve Tracker"]]  
    [:h3 "Next 10 Days"]
    [:ul
     [:li "Journal about finances"]]  
    [:h3 "Eventually"]
    [:ul
     [:li "Read Lenin"]]))

(defpage "/financial" []
  (common/layout {}
    [:h1 "Financial"]
    [:p "Make some money. Buy some things."]
    [:h3 "To Buy"] 
    [:ul
     [:li "Punching bag (~$400)"]]))  

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
    [:h3 "Books"]
     [:ul
      [:li "Capital by Karl Marx"]
      [:li "Zen and the Art of Motorcycle Maintenence by Robert Pirsig"]
      [:li "Daring Greatly by Brene Brown"]
      [:li [:a {:href "/mind/books/index"} "And many more..."]]]   
    [:h3 "Movies"]
     [:ul
      [:li "Jackie Brown"]
      [:li "Blade Runner"]
      [:li [:a {:href "/mind/movies/index"} "And many more..."]]]
    [:h3 "Ideas"]
     [:ul
      [:li "Self across time"]
      [:li "Using social reinforcement"]
      [:li [:a {:href "/mind/ideas/index"} "And many more..."]]]))

(defpage "/social" []
  (common/layout {}
    [:h1 "Social"]
    [:div {:id "social-plans"}
     [:h3 "Plans"]
     [:ul
      [:li "On Thursday, January 3 - Welcome Alex"]
      [:li "By Sunday, January 6 - Call Matt about work"]]]
    [:div {:id "social-talk-to"} 
     [:h3 "It's Been A While Since You Talked To..." ]
     [:ul
      [:li "Katie"]
      [:li "Maura"]
      [:li "Chris"]]]))
