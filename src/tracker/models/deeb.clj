(ns tracker.models.deeb
    (:use [datomic.api :only [db q] :as d]
          [clojure.pprint :only [pprint]]))

(def uri "datomic:free://localhost:4334/deeb")
(d/create-database uri)
(def conn (d/connect uri))

(def books-to-read-schema
 [{:db/id #db/id[:db.part/db]
  :db/ident :books.to-read/title
  :db/valueType :db.type/string
  :db/cardinality :db.cardinality/one
  :db.install/_attribute :db.part/db}

  {:db/id #db/id[:db.part/db]
  :db/ident :books.to-read/author
  :db/valueType :db.type/string
  :db/cardinality :db.cardinality/one
  :db.install/_attribute :db.part/db}

  {:db/id #db/id[:db.part/db]
  :db/ident :books.to-read/type
  :db/valueType :db.type/string
  :db/cardinality :db.cardinality/one
  :db.install/_attribute :db.part/db}]) 

(pprint @(d/transact conn books-to-read-schema))

(def books-to-read-data
 [["Capital" "Karl Marx" "Politics"]
  ["Wealth of Nations" "Adam Smith" "Politics"]
  ["Zen and the Art of Motorcycle Maintenance" "Robert Pirsig" "Philosophy"]])

(defn book-to-db-map [[title author type]] 
  {:db/id (d/tempid ":db.part/user") 
   :books.to-read/title title
   :books.to-read/author author
   :books.to-read/type type})

(def btr (map book-to-db-map books-to-read-data)) 

(pprint @(d/transact conn (vec btr)))

(def q1 [:find '?books :where ['?id :books.to-read/title '?books]
                              ['?id :books.to-read/type "Politics"]])

(def q2 [:find '?books :where ['?id :books.to-read/title '?books]
                              ['?id :books.to-read/author "Karl Marx"]])

(def qall [:find '?title '?author '?type 
           :where ['?id :books.to-read/title '?title]
                  ['?id :books.to-read/author '?author]
                  ['?id :books.to-read/type '?type]])

(defn all-books [] (q qall (db conn)))

(defn add-book! [book]
  (d/transact conn (vector (book-to-db-map book))))

