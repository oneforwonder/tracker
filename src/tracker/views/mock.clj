(ns tracker.views.mock
  (:use [noir.core :only [defpartial defpage]]
        [noir.response :only [redirect]]
        [noir.session :only [flash-put! flash-get]]
        [hiccup.page-helpers :only [include-css html5]]
        [tracker.views.common :only [serve-static]]))

(defpage [:get "/mock/:p"] {:keys [p]}
    (println "Serving" p)
    (if-let [msg (flash-get)]
        (html5 [:p msg])
        (serve-static (str "html/" p ".html"))))

(defpage [:post "/mock/new-food"] {:keys [food]}
    (println "Someone POSTed a new food:" food)
    (flash-put! (str "Added " food " to meal"))
    (redirect "/mock/new-food"))
