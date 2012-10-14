(ns tracker.models.db
  (:require [datomic.api :only [db q] :as d]))

(defn short-to-full [field]
  (let [[ident type cardinality doc opts] field]
    (merge
      {:db/ident       ident
       :db/valueType   type
       :db/cardinality cardinality
       :db/doc         doc
       :db.install/_attribute :db.part/db}
      opts)))

(defn defschema [entity & fields]
  (map short-to-full fields))

(defn defrelations [& relations]
  nil)

(defschema :user
  [:user/name     :string :one]
  [:user/email    :string :one]
  [:user/password :string :one])

(defschema :meal
  [:diet.meal/user :ref      :one]
  [:diet.meal/name :string   :one]
  [:diet.meal/dt   :datetime :one])

(defschema :food
  [:diet.food/meal     :ref    :one]
  [:diet.food/name     :string :one]
  [:diet.food/quantity :string :one])

(defrelations
  [:user :has-many   :meal]
  [:meal :belongs-to :user]
  [:meal :has-many   :food]
  [:food :belongs-to :meal])
