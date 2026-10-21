Feature: List a user's orders

  Background:
    Given the market has the following instruments:
      | ticker | name               | type     | close | previousClose |
      | ARS    | PESOS              | MONEDA   |       |               |
      | PAMP   | Pampa Holding S.A. | ACCIONES | 900   | 880           |

  Scenario: Orders are listed oldest first, one page at a time
    Given a user with 100000 ARS available
    And the user has a FILLED MARKET BUY for 1 shares of "PAMP"
    And the user has a FILLED MARKET BUY for 2 shares of "PAMP"
    And the user has a FILLED MARKET BUY for 3 shares of "PAMP"
    When the user lists their orders with limit "2" and offset "1"
    Then the page holds the orders:
      | side | size |
      | BUY  | 1    |
      | BUY  | 2    |
    And the page reports 4 orders in total

  Scenario: An offset past the last order returns an empty page
    Given a user with 100000 ARS available
    When the user lists their orders with limit "10" and offset "5"
    Then the page holds no orders
    And the page reports 1 orders in total

  Scenario Outline: Invalid paging parameters are a bad request
    Given a user with 100000 ARS available
    When the user lists their orders with limit "<limit>" and offset "<offset>"
    Then the request fails with status 400

    Examples:
      | limit | offset |
      | 0     | 0      |
      | 101   | 0      |
      | 10    | -1     |
      | ten   | 0      |

  Scenario: The orders of an unknown user are not found
    When someone lists the orders of user 999999
    Then the request fails with status 404
