(ns tracker.server
  (:require [noir.server :as server]))

(server/load-views 
  "src/tracker/views/"
                   ;"src/tracker/views/diet"
                   )

(defn -main [& m]
  (let [mode (keyword (or (first m) :dev))
        port (Integer. (get (System/getenv) "PORT" "8080"))]
    (server/start port {:mode mode
                        :ns 'tracker})))

