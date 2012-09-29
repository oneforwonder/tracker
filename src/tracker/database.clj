(ns tracker.models.database
  (:require [datomic.api :only [db q] :as d]))

(def base-schema
  [
   ;;Generic attributes. Blend to taste.
   {:db/doc         "A generic name attribute."
    :db/ident       :gen/name
    :db/id          #db/id[:db.part/db]
    :db/valueType   :db.type/string
    :db/fullText    true
    :db/cardinality :db.cardinality/one
    :db.install/_attribute :db.part/db}

   {:db/doc         "A generic ID attribute."
    :db/ident       :gen/id 
    :db/id          #db/id[:db.part/db]
    :db/valueType   :db.type/uuid
    :db/cardinality :db.cardinality/one
    :db.install/_attribute :db.part/db}
   
   {:db/doc         "A generic container."
    :db/ident       :gen/container
    :db/id          #db/id[:db.part/db]
    :db/valueType   :db.type/ref
    :db/cardinality :db.cardinality/one
    :db.install/_attribute :db.part/db}

   {:db/doc         "A generic subunit, probably part of a container."
    :db/ident       :gen/subunit
    :db/id          #db/id[:db.part/db]
    :db/valueType   :db.type/ref
    :db/isComponent true
    :db/cardinality :db.cardinality/many
    :db.install/_attribute :db.part/db}

   ;;included containers
   [:db/add #db/id[:db.part/user] :db/ident :container/diet]
   [:db/add #db/id[:db.part/user] :db/ident :container/exercise]

   ])

(defn init-db []
  (let [uri   "datomic:free://localhost:4334/tracker"
        dbase (d/create-database uri)
        conn  (d/connect uri)]
    (d/transact conn base-schema)
    conn))

(def conn (d/connect "datomic:free://localhost:4334/tracker"))

(defn define-entity 
  ([the-name conn] 
    (d/transact conn 
      [{:gen/name the-name
        :gen/id   (java.util.UUID/randomUUID)}]))
  ([the-name cont-or-sub conn]
    (d/transact conn
      (if (= (key cont-or-sub) :container)
        [{:gen/name the-name
          :gen/id (java.util.UUID/randomUUID)
          :gen/container (val cont-or-sub)}]
        [{:gen/name the-name
          :gen/id (java.util.UUID/randomUUID)
          :gen/subunit (val cont-or-sub)}]))))


