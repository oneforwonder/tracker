(ns tracker.views.common
  (:use [noir.core :only [defpartial]]
        [hiccup.page-helpers :only [include-css html5]]))

(defpartial layout [& content]
            (html5
              [:head
               [:title "tracker"]
               (include-css "/css/reset.css")]
              [:body
               [:div#wrapper
                content]]))
