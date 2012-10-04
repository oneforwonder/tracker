(ns tracker.models.database
  (:require [datomic.api :only [db q] :as d]))

(def schema
  [
   ;;Generic attributes. Blend to taste.
   {:db/doc         "A generic name attribute."
    :db/ident       :gen/name
    :db/id          #db/id[:db.part/db]
    :db/valueType   :db.type/string
    :db/fulltext    true
    :db/cardinality :db.cardinality/one
    :db.install/_attribute :db.part/db}

   {:db/doc         "A password."
    :db/ident       :gen/password
    :db/id          #db/id[:db.part/db]
    :db/valueType   :db.type/string
    :db/cardinality :db.cardinality/one
    :db.install/_attribute :db.part/db}

   {:db/doc         "Keyword tags?"
    :db/ident       :gen/tag
    :db/id          #db/id[:db.part/db]
    :db/valueType   :db.type/keyword
    :db/cardinality :db.cardinality/many
    :db.install/_attribute :db.part/db}

   {:db/doc         "A generic ID... just in case."
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
   [:db/add #db/id[:db.part/user] :db/ident :container/meal]
   [:db/add #db/id[:db.part/user] :db/ident :container/exercise]

   ])

(def cq ;common-queries
  {:get-item-id
     (fn [item-name] [:find '?item-id :where ['?item-id :gen/name item-name]]) 
   :get-item-subunits
     (fn [item-id] [:find '?subunits :where ['?subunit-id :gen/subunit item-id]
                                            ['?subunit-id :gen/name    '?subunits]])
     
     
     })

(def top-level-ents (list
  "Diet"
  "Exercise"
  "Projects"))

(defn init-db []
  (let [uri   "datomic:free://localhost:4334/tracker"
        dbase (d/create-database uri)
        conn  (d/connect uri)]
    @(d/transact conn schema)
    conn))

;(def conn (init-db))

(defn user-datom [name password]
  [{:gen/name name 
    :gen/password password 
    :gen/tag :user
    :db/id (d/tempid :db.part/user)}])

(defn food-datom [name meal-id]
  [{:gen/name name
    :gen/tag :food
    :gen/subunit meal-id
    :db/id (d/tempid :db.part/user)}])

(defn meal-datom [name user-id]
  [{:gen/name name
    :gen/tag :meal
    :gen/subunit user-id
    :gen/container :container/meal
    :db/id (d/tempid :db.part/user)}])

(defn user-id [username password conn]
  (ffirst 
    (d/q [:find '?uid 
          :where
            ['?uid :gen/name username]
            ['?uid :gen/password password]]
         (d/db conn))))

(defn make-meal [conn user-id meal-name & foods]
  (d/transact conn (meal-datom meal-name user-id))
  (let [meal-hash (d/q [:find '?meal-id 
                        :where ['?meal-id :gen/name meal-name]
                               ['?meal-id :gen/subunit user-id]]
                     (d/db conn))
        meal-id (ffirst meal-hash)]
    
    (doseq [x foods] (d/transact conn (food-datom x meal-id)))))
