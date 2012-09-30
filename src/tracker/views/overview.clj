(ns tracker.views.welcome
  (:require [tracker.views.common :as common]
            [noir.content.getting-started])
  (:use [noir.core]
        [hiccup.core :only [html]]))

(def sample-overviews 
  (array-map
    :To-Do     [:great "Your to-do list is empty!  Enjoy your free time."]
    :Diet      [:okay "Today, you've eaten decently -- not bad!  I bet you'll do even better tomorrow."]
    :Exercise  [:great "Your exercise for today is done AND you've set a new personal record!"]
    :Financial [:improveable "You're broke, champ.  Make more money pronto.  Maybe sell some extra organs?"]))

(def judgement-scores
  {:improveable 0
   :okay        1
   :great       2})

(defn avg [coll]
  (/ (reduce + coll) (count coll)))

(defn reverse-map [m]
  (into {} (map (fn [[a b]] [b a]) m)))

(def judgement-classes
  {:great       "judgement text-success"
   :okay        "judgement text-success"
   :improveable "judgement text-error"})

(println (vals sample-overviews))

(defpartial overall [overviews]
  (let [oa (->> (vals overviews)
                (map first)
                (map judgement-scores)
                (avg)
                (float)
                (Math/round)
                ((reverse-map judgement-scores)))]
    [:p {:class "lead"} 
     "Overall you're doing "
     [:span {:class (judgement-classes oa)} (name oa)]
     " today."]))

(defpartial overview-box [category j text bg]
  [:div {:class (str "category-overview " bg)}
    [:h3 category]
    [:p text]
    [:p "Rating: "
      [:span {:class (judgement-classes j)} (name j)]]])

(defpage "/overview" [] 
  (common/layout
    [:h1 "Tracker Overview"]

    (overall sample-overviews)

    (map (fn [[category [judgement msg]] bg]
             (overview-box category judgement msg bg))
         sample-overviews
         (cycle ["pale-green-bg" "pale-blue-bg"]))

    ;(overview-box
      ;"To-Do"
      ;"category-overview pale-green-bg"
      ;"Your to-do list is empty!  Enjoy your free time."
      ;:Great)

    ;(overview-box
      ;"Diet"
      ;"category-overview pale-blue-bg"
      ;"Today, you've eaten decently -- not bad!  I bet you'll do even better tomorrow."
      ;:Okay)

    ;(overview-box
      ;"Exercise"
      ;"category-overview pale-green-bg"
      ;"Your exercise for today is done AND you've set a new personal record!"
      ;:Great)

    ;(overview-box
      ;"Financial"
      ;"category-overview pale-blue-bg"
      ;"You're broke, champ.  Make more money pronto.  Maybe sell some extra organs?"
      ;:Improveable))
  
  )) 
