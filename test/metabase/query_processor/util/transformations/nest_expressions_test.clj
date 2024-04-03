(ns metabase.query-processor.util.transformations.nest-expressions-test
  "Additional tests are in [[metabase.query-processor.util.nest-query-test]]."
  (:require
   [clojure.test :refer :all]
   [metabase.lib.core :as lib]
   [metabase.lib.query :as lib.query]
   [metabase.lib.test-metadata :as meta]
   [metabase.lib.test-util.macros :as lib.tu.macros]
   [metabase.query-processor.util.transformations.nest-expressions :as nest-expressions]))

(deftest ^:parallel nest-expressions-with-joins-test
  (let [query (lib.query/query
               meta/metadata-provider
               (lib.tu.macros/mbql-query orders
                 {:aggregation [[:aggregation-options [:count] {:name "count"}]]
                  :breakout    [&PRODUCTS__via__PRODUCT_ID.products.category
                                !year.created-at
                                [:expression "pivot-grouping"]]
                  :expressions {"pivot-grouping" [:abs 0]}
                  :order-by    [[:asc &PRODUCTS__via__PRODUCT_ID.products.category]
                                [:asc !year.created-at]
                                [:asc [:expression "pivot-grouping"]]]
                  :joins       [{:source-table $$products
                                 :strategy     :left-join
                                 :alias        "PRODUCTS__via__PRODUCT_ID"
                                 :fk-field-id  %product-id
                                 :condition    [:= $product-id &PRODUCTS__via__PRODUCT_ID.products.id]
                                 :fields       :all}]}))]
    (is (=? {:stages [{:lib/type     :mbql.stage/mbql
                       :joins        [{:strategy    :left-join
                                       :alias       "PRODUCTS__via__PRODUCT_ID"
                                       :conditions  [[:=
                                                      {}
                                                      [:field {} (meta/id :orders :product-id)]
                                                      [:field {:join-alias "PRODUCTS__via__PRODUCT_ID"} (meta/id :products :id)]]]
                                       :stages      [{:source-table (meta/id :products)}]
                                       :lib/options {}}]
                       :expressions  [[:abs {:lib/expression-name "pivot-grouping"} 0]]
                       :fields       [[:field {} (meta/id :orders :created-at)]
                                      [:expression {} "pivot-grouping"]
                                      [:field {:join-alias "PRODUCTS__via__PRODUCT_ID"} (meta/id :products :category)]]}
                      {:aggregation [[:count {:name "count"}]]
                       :breakout    [[:field {} "PRODUCTS__via__PRODUCT_ID__CATEGORY"]
                                     [:field {} "CREATED_AT"]
                                     [:field {} "pivot-grouping"]]
                       :order-by [[:asc {} [:field {} "PRODUCTS__via__PRODUCT_ID__CATEGORY"]]
                                  [:asc {} [:field {} "CREATED_AT"]]
                                  [:asc {} [:field {} "pivot-grouping"]]]}]}
            (nest-expressions/nest-expressions query)))))

(deftest ^:parallel nested-expressions-with-existing-names-test
  (testing "Expressions with the same name as existing columns should work correctly in nested queries (#21131)"
    (let [query (lib.query/query
                 meta/metadata-provider
                 (lib.tu.macros/mbql-query products
                   {:source-query {:source-table $$products
                                   :expressions  {"PRICE" [:+ $price 2]}
                                   :fields       [$id $price [:expression "PRICE"]]
                                   :order-by     [[:asc $id]]
                                   :limit        2}}))]
      (is (=? {:stages [{:expressions [[:+
                                        {:lib/expression-name "PRICE"}
                                        [:field {} (meta/id :products :price)]
                                        2]]
                         :fields [[:field {} (meta/id :products :id)]
                                  [:field {} (meta/id :products :price)]
                                  [:expression {} "PRICE"]]}
                        {:lib/type :mbql.stage/mbql
                         :fields [[:field {} "ID"]
                                  [:field {} "PRICE"]
                                  [:field {} "PRICE_2"]]
                         :order-by [[:asc {} [:field {} "ID"]]]
                         :limit 2}
                        {:lib/type :mbql.stage/mbql}]}
              (nest-expressions/nest-expressions query))))))

(deftest ^:parallel nested-expressions-with-existing-names-test-2
  (testing "Expressions with the same name as existing columns but different case should work as well (#21131)"
    (let [query (lib.tu.macros/mbql-query products
                  {:source-query {:source-table $$products
                                  :expressions  {"price" [:+ $price 2]}
                                  :fields       [$id $price [:expression "price"]]}})
          query (lib/query meta/metadata-provider query)]
      (is (=? {:stages [{:expressions [[:+
                                        {:lib/expression-name "price"}
                                        [:field {} 17503]
                                        2]]
                         :fields [[:field {} (meta/id :products :id)]
                                  [:field {} (meta/id :products :price)]
                                  [:expression {} "price"]]}
                        {:fields [[:field {} "ID"]
                                  [:field {} "PRICE"]
                                  [:field {} "price_2"]]}
                        {:lib/type :mbql.stage/mbql}]}
              (nest-expressions/nest-expressions query))))))
