(ns tracker.views.mock
  (:use 
        [noir.core :only [defpartial defpage]]
        [noir.response :only [redirect]]
        [noir.session :only [flash-put! flash-get]]
        [hiccup.page-helpers :only [include-css html5]]
        [tracker.util :only [serve-static]]))

