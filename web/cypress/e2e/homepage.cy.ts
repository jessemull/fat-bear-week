/// <reference types="cypress" />

describe("Homepage", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should display the Fat Bear Week brand heading", () => {
    cy.get("h1").should("contain", "Fat Bear Week");
  });

  it("should mention the fantasy bracket", () => {
    cy.contains("Fantasy Bracket").should("be.visible");
  });
});
