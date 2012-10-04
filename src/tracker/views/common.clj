(ns tracker.views.common
  (:use [noir.core :only [defpartial]]
        [hiccup.page-helpers :only [include-css include-js html5]]))

(def sidebar-links (array-map 
  :Overview    "/overview"
  :To-Do       "/todo"
  :Diet        "/diet"
  :Exercise    "/exercise"
  :Financial   "/financial"
  :Programming "/programming"
  :Music       "/music"
  :Mind        "/mind"
  :Social      "/social"))

(defpartial sidebar []
  [:div {:class "span3"}
    [:ul {:class "nav nav-tabs nav-stacked sidenav"}
      (map 
        (fn [[section address]]
          [:li
            [:a {:href address} 
              [:i {:class "icon-chevron-right"}]
              (name section)]])
        sidebar-links)]])

(defpartial layout [options & content]
  (html5 {:lang "en"}
    [:head
      [:meta {:charset "utf-8"}]
      [:title "Rob's And Alex's Tracker for Tracking Things and Stuff That Alex And Rob Want To Track!"]
     (map include-css
          (concat ["http://netdna.bootstrapcdn.com/twitter-bootstrap/2.1.1/css/bootstrap-combined.min.css"
                   "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.23/themes/smoothness/jquery-ui.css"
                   "/css/app.css"]
                  (:css options)))
     (map include-js 
          (concat ["https://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.js" 
                   "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.23/jquery-ui.min.js" 
                   "http://netdna.bootstrapcdn.com/twitter-bootstrap/2.1.1/js/bootstrap.min.js"
                   "/js/main.js"] 
                  (:js options)))]
    [:body
      [:div {:class "container"} 
        [:div {:class "row"}
          (sidebar)
          [:div {:class "span9 content"} content]]]]))
