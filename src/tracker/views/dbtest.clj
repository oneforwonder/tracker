(ns tracker.views.dbtest
  (:use [noir.core :only [defpartial defpage]]
        [noir.response :only [redirect]]
        [noir.session :only [flash-put! flash-get]]
        [hiccup.page-helpers :only [include-css html5]]
        [tracker.util :only [serve-static]]
        [tracker.models.database :as td]
        [datomic.api :only [db q] :as d]))

;(def this-conn (d/connect "datomic:free://localhost:4334/tracker"))


(defpage [:get "/dbtest/:username/:password"] {:keys [username password]}
  (d/transact td/conn (td/user-datom username password)) 
  (let [usr-id (d/q [:find '?user-id 
                     :where 
                       ['?user-id :gen/name username];]
                       ['?user-id :gen/password password]] 
                    (d/db td/conn))]
    (str (ffirst usr-id))))

(defpage [:get "/mock/:p"] {:keys [p]}
    (println "Serving" p)
    (if-let [msg (flash-get)]
        (html5 [:p msg])
        (serve-static (str "html/" p ".html"))))

(defpage [:post "/mock/new-food"] {:keys [food]}
    (println "Someone POSTed a new food:" food)
    (flash-put! (str "Added " food " to meal"))
    (redirect "/mock/new-food"))
