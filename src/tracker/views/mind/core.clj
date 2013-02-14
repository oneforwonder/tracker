(ns tracker.views.mind.core
  (:require [tracker.views.common :as common])
  (:use [tracker.models.deeb :only [all-books add-book!]]
        [tracker.util :only [form-row]]  
        [clojure.pprint :only [pprint]]
        [noir.core]
        [hiccup.core :only [html]]))

(defpage [:post "/mind/books/new"] {:keys [title author type] :as book}
  (add-book! [title author type])
  (render "/mind/books"))

(defpage [:get "/mind/books/new"] []
  (common/layout 
    {:css ["/css/timepicker.css"]}
    [:h2 "New Book to Read"]
    [:form {:class "form-horizontal" :action "/mind/books/new" :method "post"}
     (form-row {:label "Title"})
     (form-row {:label "Author"})
     (form-row {:label "Type"})
     [:div {:id "form-buttons"} 
      [:button {:id "submit-book-btn" :class "btn btn-primary" :type "submit"} "Save"]]]))

(defpartial book-row [[title author type]]
    [:tr
     [:td title]
     [:td author]
     [:td type]])

(defpage "/mind/books" []
    (common/layout {}
      [:h2 "Books to read"]
      [:table {:class "table"}
       [:tr {:class "table-header"} [:td "Title"] [:td "Author"] [:td "Type"]]
       (map book-row (all-books))]
      [:a {:href "/mind/books/new"} "Add a book"]))

(defpartial book-text [[title author type]]
    [:li 
     [:span {:class "book-title"} title]
     " by " [:span {:class "book-author"} author]])

(defpage "/mind" []
  (common/layout {}
    [:h1 "Mind"]
    [:h3 [:a {:href "/mind/books"} "Books to Read"]]
     [:ul
      (map book-text (all-books))
      ;[:li [:a {:href "/mind/books"} "And many more..."]]
      ]   
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

