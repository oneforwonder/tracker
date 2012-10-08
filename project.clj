(defproject tracker "0.1.0-SNAPSHOT"
            :description "Order from chaos; inspiration's implementation"
            :dependencies [[org.clojure/clojure "1.4.0"] ; required by Datomic
                           [com.datomic/datomic-free "0.8.3538"]
                           [noir "1.3.0-beta10" :exclusions [org.clojure/clojure]]
                           [jayq "0.1.0-alpha3"]
                           [fetch "0.1.0-alpha2"]
                           [crate "0.2.1"]
                           [clj-time "0.4.4"]] 
            :plugins [[lein-cljsbuild "0.2.1"]]
            :cljsbuild {:repl-listen-port 9000
                        :repl-launch-commands {"ff" ["firefox" "-jsconsole" "http://localhost:8080/"]}
                        :builds [{:source-path "src-cljs/tracker"
                                  :compiler {:output-to "resources/public/js/main.js"
                                             :optimizations :whitespace
                                             :pretty-print true}}]}
            :main tracker.server)

