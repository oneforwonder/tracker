(ns tracker.views.common
  (:use [clojure.java.io :only [resource]]
        [noir.core :only [defpartial]]
        [hiccup.page-helpers :only [include-css html5]]))

(defn serve-static [res]
  (slurp (resource (str "public/" res))))

(defpartial layout [& content]
            (html5
              [:head
               [:title "tracker"]
               (include-css "/css/reset.css")]
              [:body
               [:div#wrapper
                content]]))
