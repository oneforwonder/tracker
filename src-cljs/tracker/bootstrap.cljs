(ns tracker.bootstrap
  (:use [jayq.util :only [clj->js]]))

(defn popover [e arg]
  (.popover e (clj->js arg)))

(defn modal [e arg]
  (.modal e (clj->js arg)))
