/// <reference types="cypress" />

describe("Login", () => {
  it("should link to forgot password", () => {
    cy.visit("/login");
    cy.contains("Forgot password?").should("have.attr", "href", "/forgot-password");
  });

  it("should show the forgot password heading", () => {
    cy.visit("/forgot-password");
    cy.contains("h1", "Forgot password");
  });
});
