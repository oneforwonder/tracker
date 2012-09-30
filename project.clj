(defproject tracker "0.1.0-SNAPSHOT"
            :description "Order from chaos; inspiration's implementation"
            :dependencies [[org.clojure/clojure "1.4.0"]
                           [com.datomic/datomic-free "0.8.3538"]
                           [noir "1.2.1"]
                           [clj-time "0.4.4"]]
            :main tracker.server)

