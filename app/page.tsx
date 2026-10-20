"use client";

import { cloneElement, isValidElement, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Mail, MapPin, Menu, Moon, Scale, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const links = ["Expertise", "Clients", "Method", "The firm", "FAQ"];

const french: Record<string, string> = {
  "Law firm and authorised agents": "Cabinet d’avocats et mandataires agréés",
  Expertise: "Expertise", Clients: "Clients", Method: "Méthode", "The firm": "Le cabinet", FAQ: "FAQ",
  "Book a meeting": "Prendre rendez-vous", "Present your case": "Présentez votre dossier", "See our expertise": "Voir notre expertise",
  "Dark mode": "Mode sombre", "Light mode": "Mode clair",
  "Counsel · Rights · Growth": "Conseil · Droits · Croissance",
  "Administrative & judicial seat": "Siège administratif et judiciaire",
  "Mining region · Haut-Katanga": "Région minière · Haut-Katanga",
  "One team, close to your projects": "Une équipe proche de vos projets",
  "Law in the service of": "Le droit au service des", "Congolese projects.": "projets congolais.",
  "Cabinet PKM advises and defends companies, investors and brand owners in the Democratic Republic of the Congo: business law, mining and quarries, intellectual property.": "Le Cabinet PKM conseille et défend les entreprises, les investisseurs et les titulaires de marques en République démocratique du Congo : droit des affaires, mines et carrières, propriété intellectuelle.",
  "Lawyer, advice and litigation": "Avocat, conseil et contentieux", "Three professions, one point of contact": "Trois métiers, un seul interlocuteur",
  "Lawyer:": "Avocat :", " business advice and litigation": " conseil aux entreprises et contentieux",
  "Mining and quarry agent:": "Mandataire en mines et carrières :", " titles and procedures": " titres et démarches",
  "Trademark and IP agent:": "Mandataire en marques et PI :", " protection and defence": " protection et défense",
  "Our expertise": "Notre expertise", "Ce que nous faisons": "Notre expertise",
  "Each case is handled by a lawyer who knows the law, the administrations and the field, in Kinshasa or in Lubumbashi.": "Chaque dossier est suivi par un avocat qui connaît le droit, les administrations et le terrain, à Kinshasa comme à Lubumbashi.",
  Lawyer: "Avocat", "Business law and litigation": "Droit des affaires et contentieux",
  "We support Congolese and foreign companies in structuring their activities and securing their commercial relationships, in court and at the negotiating table.": "Nous accompagnons les entreprises congolaises et étrangères dans la structuration de leurs activités et la sécurisation de leurs relations commerciales, au tribunal comme à la table des négociations.",
  "Company formation and organisation, OHADA law": "Création et organisation de sociétés, droit OHADA", "Drafting and negotiating commercial contracts": "Rédaction et négociation de contrats commerciaux", "Dispute management, mediation and arbitration": "Gestion des litiges, médiation et arbitrage", "Compliance, employment law, debt recovery": "Conformité, droit du travail et recouvrement de créances",
  "Mining and quarry agent": "Mandataire en mines et carrières", "Mining titles and quarries": "Titres miniers et carrières",
  "We represent operators before the competent authorities and make sure their rights remain valid, from acquiring a title to renewing it.": "Nous représentons les opérateurs auprès des autorités compétentes et veillons à la validité de leurs droits, de l’obtention au renouvellement des titres.",
  "Applications and renewals of mining and quarry titles": "Demandes et renouvellements de titres miniers et de carrières", "Follow-up files at the Mining Registry and public services": "Suivi des dossiers au Cadastre minier et auprès des services publics", "Legal audit of titles before acquisition or financing": "Audit juridique des titres avant acquisition ou financement", "Mining Code compliance, subcontracting and transfer agreements": "Conformité au Code minier, sous-traitance et accords de cession",
  "Trademark and IP agent": "Mandataire en marques et propriété intellectuelle", "Trademarks and intangible assets": "Marques et actifs immatériels",
  "Your name, your logo and your creations are assets. We register, monitor and defend them.": "Votre nom, votre logo et vos créations sont des actifs. Nous les enregistrons, les surveillons et les défendons.", "Prior-rights searches, trademark filing and registration": "Recherche d’antériorités, dépôt et enregistrement de marques", "Renewal, assignment and licensing": "Renouvellement, cession et licence", "Oppositions and counterfeiting actions": "Oppositions et actions en contrefaçon", "Copyright and protection of creative works": "Droit d’auteur et protection des œuvres",
  "À qui nous nous adressons": "Nos clients", "Who we work with": "Nos clients", "Operators with a concrete project who need reliable legal advice to move it forward.": "Des opérateurs avec un projet concret qui ont besoin de conseils juridiques fiables pour avancer.",
  "Mining companies and subcontractors": "Sociétés minières et sous-traitants", "Title holders, investors, traders and service providers in the mining sector of Haut-Katanga and beyond.": "Titulaires de titres, investisseurs, négociants et prestataires du secteur minier du Haut-Katanga et d’ailleurs.", "Foreign investors and companies": "Investisseurs et entreprises étrangers", "Groups setting up in the DRC that want to structure their presence, contracts and risks.": "Groupes qui s’implantent en RDC et souhaitent structurer leur présence, leurs contrats et leurs risques.", "SMEs, entrepreneurs and creators": "PME, entrepreneurs et créateurs", "Traders, local brands, artists and start-ups who want to protect their name and creations.": "Commerçants, marques locales, artistes et jeunes entreprises qui veulent protéger leur nom et leurs créations.",
  "Notre méthode": "Notre méthode", "How we work": "Notre méthode", "A clear approach, with an identified contact at every stage.": "Une démarche claire, avec un interlocuteur identifié à chaque étape.", Listening: "Écoute", "A first conversation to understand your situation, deadlines and stakes.": "Un premier échange pour comprendre votre situation, vos délais et vos enjeux.", Analysis: "Analyse", "Review of the texts, documents and risks, then presentation of the options.": "Étude des textes, des documents et des risques, puis présentation des options.", Strategy: "Stratégie", "A roadmap agreed with you, and fees announced in advance.": "Une feuille de route définie avec vous et des honoraires annoncés à l’avance.", "Follow-up": "Suivi", "Execution of the procedures, regular reporting and support through to the outcome.": "Mise en œuvre des démarches, comptes rendus réguliers et accompagnement jusqu’à leur aboutissement.",
  "Portrait to be added": "Portrait à ajouter", "Attorney": "Avocat",
  "Lawyer, mining and quarry agent and trademark and intellectual property agent, he founded Cabinet PKM with offices in Lubumbashi and Kinshasa.": "Avocat, mandataire en mines et carrières et mandataire en marques et propriété intellectuelle, il a fondé le Cabinet PKM, présent à Lubumbashi et à Kinshasa.", "His practice connects business law to two areas that matter greatly in the DRC: mineral resources and brand value.": "Sa pratique relie le droit des affaires à deux enjeux majeurs en RDC : les ressources minérales et la valeur des marques.", "Recognition.": "Distinction.", " Pierre Kasongo is ranked in the Chambers Global Guide 2025 for general business law in the DRC (Band 2).": " Pierre Kasongo figure dans le Chambers Global Guide 2025 en droit général des affaires en RDC (Band 2).",
  "Ancrage local": "Notre présence", "Two offices, one team": "Deux bureaux, une équipe", Kinshasa: "Kinshasa", Lubumbashi: "Lubumbashi", "Administrative and judicial seat; courts, ministries and institutional partners.": "Siège administratif et judiciaire ; tribunaux, ministères et partenaires institutionnels.", "In the heart of the mining province: titles, operators and subcontractors of Haut-Katanga.": "Au cœur de la province minière : titres, opérateurs et sous-traitants du Haut-Katanga.",
  "Questions fréquentes": "Questions fréquentes", "Frequently asked questions": "Questions fréquentes", "Why register a trademark in the DRC?": "Pourquoi enregistrer une marque en RDC?", "Registration helps establish rights to your brand and gives you legal tools to oppose unauthorised use and counterfeiting.": "L’enregistrement établit vos droits sur votre marque et vous donne des moyens juridiques pour vous opposer aux usages non autorisés et à la contrefaçon.", "How are your fees calculated?": "Comment vos honoraires sont-ils calculés?", "Fees depend on the nature, complexity and urgency of the matter. We discuss the scope and fee arrangements with you before starting work.": "Les honoraires dépendent de la nature, de la complexité et de l’urgence du dossier. Nous convenons avec vous de la mission et des honoraires avant de commencer.", "Do you act for foreign clients?": "Travaillez-vous pour des clients étrangers?", "Yes. We advise foreign investors and companies entering the DRC, including on local structures, contracts, compliance and disputes.": "Oui. Nous conseillons les investisseurs et entreprises étrangers qui s’implantent en RDC, notamment sur les structures locales, les contrats, la conformité et les litiges.", "Are my exchanges with the firm confidential?": "Mes échanges avec le cabinet sont-ils confidentiels?", "Professional secrecy and confidentiality apply to our work in accordance with the rules governing the profession.": "Le secret professionnel et la confidentialité s’appliquent à notre travail conformément aux règles de la profession.",
  "Parlons de votre projet": "Parlons de votre projet", "Let's discuss your case": "Parlons de votre dossier", "Describe your need in a few lines. The firm will get back to you to arrange a first conversation.": "Décrivez votre besoin en quelques lignes. Le cabinet vous recontactera pour organiser un premier échange.", "Offices in Kinshasa and Lubumbashi": "Bureaux à Kinshasa et Lubumbashi", "Reply within two working days": "Réponse sous deux jours ouvrés", "Exchanges covered by professional secrecy": "Échanges couverts par le secret professionnel", "Full name": "Nom complet", Phone: "Téléphone", "Email address": "Adresse e-mail", Subject: "Sujet", "Business law / litigation": "Droit des affaires / contentieux", "Trademarks and intellectual property": "Marques et propriété intellectuelle", "Other request": "Autre demande", "Your message": "Votre message", "Send my request": "Envoyer ma demande", "This form opens your email app with the message pre-filled. It is not a legal consultation.": "Ce formulaire ouvre votre messagerie avec le message prérempli. Il ne constitue pas une consultation juridique.",
  "Cabinet PKM": "Cabinet PKM", "Lawyers, mining and quarry agent, trademark and intellectual property agent.": "Avocats, mandataires en mines et carrières, marques et propriété intellectuelle.", "Kinshasa and Lubumbashi, Democratic Republic of the Congo.": "Kinshasa et Lubumbashi, République démocratique du Congo.", Contact: "Contact", "The information on this site is general in nature and does not replace personalised legal advice.": "Les informations de ce site sont générales et ne remplacent pas un conseil juridique personnalisé.", "Any questions?": "Une question?",
};

function localize(node: ReactNode, language: "en" | "fr"): ReactNode {
  if (typeof node === "string") {
    if (language === "en") return node;
    const trimmed = node.trim();
    const translation = french[trimmed];
    return translation ? node.replace(trimmed, translation) : node;
  }
  if (Array.isArray(node)) {
    return node.map((child, index) => {
      const localizedChild = localize(child, language);

      // React's Children.toArray would add keys, but this recursive traversal
      // intentionally preserves the original element tree. Add a stable key
      // to array elements that were created without one.
      if (isValidElement(localizedChild) && localizedChild.key === null) {
        return cloneElement(localizedChild, { key: `localized-child-${index}` });
      }

      return localizedChild;
    });
  }
  if (isValidElement<{ children?: ReactNode }>(node) && node.props.children) {
    return cloneElement(node, { key: node.key ?? undefined }, localize(node.props.children, language));
  }
  return node;
}

export default function Home() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [pauseHeroCarousel, setPauseHeroCarousel] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const darkMode = resolvedTheme === "dark";
  function toggleTheme() {
    const appliedDarkMode = document.documentElement.classList.contains("dark");
    setTheme(appliedDarkMode ? "light" : "dark");
  }
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);
  useEffect(() => {
    if (pauseHeroCarousel || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % 3);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [pauseHeroCarousel]);

  function showHeroSlide(index: number) {
    setActiveHeroSlide((index + 3) % 3);
  }
  const page = (
    <main className="site-shell min-h-screen bg-[#0d3b32] text-[#f4f5f0]">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="PKM — accueil">
          <span className="brand-name">PKM</span>
          <span className="brand-caption">Law firm and authorised agents</span>
        </a>

        <nav className="primary-nav" aria-label="Navigation principale">
          {links.map((link) => (
            <a key={link} href={`#${link === "Method" ? "méthode" : link.toLowerCase().replaceAll(" ", "-")}`}>
              {link}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <div className="language-switch" aria-label="Language selection">
            <button className={language === "fr" ? "active" : ""} type="button" aria-label="Français" aria-pressed={language === "fr"} onClick={() => setLanguage("fr")}>FR</button>
            <button className={language === "en" ? "active" : ""} type="button" aria-label="English" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
          </div>
          <Button className="theme-toggle" variant="ghost" size="icon" type="button" onClick={toggleTheme} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={darkMode} title={darkMode ? "Light mode" : "Dark mode"}>
            {darkMode ? <Sun size={14} strokeWidth={1.7} /> : <Moon size={14} strokeWidth={1.7} />}
          </Button>
          <a className="header-cta" href="#contact">
            Book a meeting <ArrowUpRight size={12} strokeWidth={1.8} />
          </a>
        </div>

        <div className="mobile-controls">
          <button className="mobile-language" type="button" onClick={() => setLanguage(language === "en" ? "fr" : "en")} aria-label={language === "en" ? "Passer en français" : "Switch to English"}>
            {language === "en" ? "FR" : "EN"}
          </button>
          <button className="mobile-menu" type="button" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen((open) => !open)}>
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        <nav className={`mobile-menu-panel${mobileMenuOpen ? " is-open" : ""}`} id="mobile-navigation" aria-label="Mobile navigation" aria-hidden={!mobileMenuOpen}>
          <div className="mobile-menu-inner">
            <nav className="mobile-menu-links" aria-label="Mobile navigation links">
              {links.map((link) => (
                <a key={link} href={`#${link === "Method" ? "méthode" : link.toLowerCase().replaceAll(" ", "-")}`} onClick={() => setMobileMenuOpen(false)}>
                  {link}
                </a>
              ))}
            </nav>
            <div className="mobile-menu-actions">
              <Button className="mobile-theme-toggle" variant="outline" type="button" onClick={toggleTheme}>
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                {darkMode ? "Light mode" : "Dark mode"}
              </Button>
              <a className="mobile-menu-cta" href="#contact" onClick={() => setMobileMenuOpen(false)}>
                Book a meeting <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </nav>
      </header>
      <section className="hero" id="top" aria-label="Introduction">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-eyebrow">Cabinet PKM · Kinshasa & Lubumbashi</p>
            <h1>Law in the service of<br className="desktop-break" /> Congolese projects.</h1>
            <p className="hero-description">
              Cabinet PKM advises and defends companies, investors and brand owners in the Democratic Republic of the Congo: business law, mining and quarries, intellectual property.
            </p>
            <div className="hero-buttons">
              <a className="hero-button hero-button-primary" href="#contact">Present your case</a>
              <a className="hero-button hero-button-secondary" href="#expertise">See our expertise</a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Cabinet PKM en images">
            <div className="hero-orbit hero-orbit-one" />
            <div className="hero-orbit hero-orbit-two" />
            <div className="hero-orbit hero-orbit-three" />
            <div className="hero-carousel" onMouseEnter={() => setPauseHeroCarousel(true)} onMouseLeave={() => setPauseHeroCarousel(false)} onFocusCapture={() => setPauseHeroCarousel(true)} onBlurCapture={() => setPauseHeroCarousel(false)}>
              <div className="hero-slides" aria-live="off">
                <div className={`hero-slide${activeHeroSlide === 0 ? " is-active" : ""}`} aria-hidden={activeHeroSlide !== 0}>
                  <div className="service-card">
                    <div className="scales-panel">
                      <span className="scales-grid" />
                      <Scale className="scales-icon" strokeWidth={0.8} />
                      <span className="scales-pivot" />
                    </div>
                    <div className="service-card-caption">
                      <span>Lawyer, advice and litigation</span>
                      <span className="caption-mark">+</span>
                    </div>
                    <div className="service-card-content">
                      <strong>Three professions, one point of contact</strong>
                      <p><b>Lawyer:</b> business advice and litigation</p>
                      <p><b>Mining and quarry agent:</b> titles and procedures</p>
                      <p><b>Trademark and IP agent:</b> protection and defence</p>
                    </div>
                  </div>
                </div>

                <div className={`hero-slide${activeHeroSlide === 1 ? " is-active" : ""}`} aria-hidden={activeHeroSlide !== 1}>
                  <div className="brand-art-card">
                    <div className="brand-art-lines brand-art-lines-one" />
                    <div className="brand-art-lines brand-art-lines-two" />
                    <div className="brand-art-ring">
                      <span className="brand-art-name">PKM</span>
                      <span className="brand-art-caption">Cabinet PKM</span>
                    </div>
                    <span className="brand-art-accent" />
                    <span className="brand-art-label">Counsel · Rights · Growth</span>
                  </div>
                </div>

                <div className={`hero-slide${activeHeroSlide === 2 ? " is-active" : ""}`} aria-hidden={activeHeroSlide !== 2}>
                  <div className="cities-art-card">
                    <span className="cities-art-overline">Cabinet PKM · DRC</span>
                    <div className="cities-art-route" aria-hidden="true"><span /><i /><span /></div>
                    <div className="cities-art-cities">
                      <p><MapPin size={15} /><strong>Kinshasa</strong><small>Administrative & judicial seat</small></p>
                      <p><MapPin size={15} /><strong>Lubumbashi</strong><small>Mining region · Haut-Katanga</small></p>
                    </div>
                    <span className="cities-art-label">One team, close to your projects</span>
                  </div>
                </div>
              </div>

              <div className="carousel-controls" aria-label="Hero carousel controls">
                <button type="button" className="carousel-arrow" aria-label="Previous visual" onClick={() => showHeroSlide(activeHeroSlide - 1)}><ArrowLeft size={14} /></button>
                <div className="carousel-dots" role="group" aria-label="Choose visual">
                  {[0, 1, 2].map((index) => (
                    <button key={index} type="button" className={`carousel-dot${activeHeroSlide === index ? " is-active" : ""}`} aria-label={`Show visual ${index + 1}`} aria-pressed={activeHeroSlide === index} onClick={() => showHeroSlide(index)} />
                  ))}
                </div>
                <button type="button" className="carousel-arrow" aria-label="Next visual" onClick={() => showHeroSlide(activeHeroSlide + 1)}><ArrowRight size={14} /></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="expertise-section" id="expertise">
        <div className="section-container">
          <div className="section-heading">
            <p className="section-kicker">Ce que nous faisons</p>
            <h2>Our expertise</h2>
            <p>Each case is handled by a lawyer who knows the law, the administrations and the field, in Kinshasa or in Lubumbashi.</p>
          </div>

          <div className="expertise-list">
            <article className="expertise-row">
              <div className="expertise-title">
                <span>Lawyer</span>
                <h3>Business law and litigation</h3>
              </div>
              <div className="expertise-detail">
                <p>We support Congolese and foreign companies in structuring their activities and securing their commercial relationships, in court and at the negotiating table.</p>
                <ul>
                  <li>Company formation and organisation, OHADA law</li>
                  <li>Drafting and negotiating commercial contracts</li>
                  <li>Dispute management, mediation and arbitration</li>
                  <li>Compliance, employment law, debt recovery</li>
                </ul>
              </div>
            </article>

            <article className="expertise-row">
              <div className="expertise-title">
                <span>Mining and quarry agent</span>
                <h3>Mining titles and quarries</h3>
              </div>
              <div className="expertise-detail">
                <p>We represent operators before the competent authorities and make sure their rights remain valid, from acquiring a title to renewing it.</p>
                <ul>
                  <li>Applications and renewals of mining and quarry titles</li>
                  <li>Follow-up files at the Mining Registry and public services</li>
                  <li>Legal audit of titles before acquisition or financing</li>
                  <li>Mining Code compliance, subcontracting and transfer agreements</li>
                </ul>
              </div>
            </article>

            <article className="expertise-row">
              <div className="expertise-title">
                <span>Trademark and IP agent</span>
                <h3>Trademarks and intangible assets</h3>
              </div>
              <div className="expertise-detail">
                <p>Your name, your logo and your creations are assets. We register, monitor and defend them.</p>
                <ul>
                  <li>Prior-rights searches, trademark filing and registration</li>
                  <li>Renewal, assignment and licensing</li>
                  <li>Oppositions and counterfeiting actions</li>
                  <li>Copyright and protection of creative works</li>
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="clients-section" id="clients">
        <div className="section-container">
          <div className="section-heading clients-heading">
            <p className="section-kicker">À qui nous nous adressons</p>
            <h2>Who we work with</h2>
            <p>Operators with a concrete project who need reliable legal advice to move it forward.</p>
          </div>
          <div className="client-groups">
            <article className="client-group">
              <h3>Mining companies and subcontractors</h3>
              <p>Title holders, investors, traders and service providers in the mining sector of Haut-Katanga and beyond.</p>
            </article>
            <article className="client-group">
              <h3>Foreign investors and companies</h3>
              <p>Groups setting up in the DRC that want to structure their presence, contracts and risks.</p>
            </article>
            <article className="client-group">
              <h3>SMEs, entrepreneurs and creators</h3>
              <p>Traders, local brands, artists and start-ups who want to protect their name and creations.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="method-section" id="méthode">
        <div className="section-container">
          <div className="section-heading method-heading">
            <p className="section-kicker">Notre méthode</p>
            <h2>How we work</h2>
            <p>A clear approach, with an identified contact at every stage.</p>
          </div>
          <div className="method-steps">
            <article className="method-step">
              <span className="step-number">1</span>
              <h3>Listening</h3>
              <p>A first conversation to understand your situation, deadlines and stakes.</p>
            </article>
            <article className="method-step">
              <span className="step-number">2</span>
              <h3>Analysis</h3>
              <p>Review of the texts, documents and risks, then presentation of the options.</p>
            </article>
            <article className="method-step">
              <span className="step-number">3</span>
              <h3>Strategy</h3>
              <p>A roadmap agreed with you, and fees announced in advance.</p>
            </article>
            <article className="method-step">
              <span className="step-number">4</span>
              <h3>Follow-up</h3>
              <p>Execution of the procedures, regular reporting and support through to the outcome.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="founder-section" id="the-firm">
        <div className="section-container founder-layout">
          <div className="founder-portrait" role="img" aria-label="Portrait de Pierre Kasongo Makanda à ajouter">
            <span className="portrait-monogram">PKM</span>
            <span className="portrait-caption">Portrait to be added</span>
          </div>
          <div className="founder-copy">
            <p className="founder-kicker">The firm</p>
            <h2>Pierre Kasongo Makanda,<br />Attorney</h2>
            <p className="founder-intro">Lawyer, mining and quarry agent and trademark and intellectual property agent, he founded Cabinet PKM with offices in Lubumbashi and Kinshasa.</p>
            <p>His practice connects business law to two areas that matter greatly in the DRC: mineral resources and brand value.</p>
            <div className="recognition-note">
              <strong>Recognition.</strong> Pierre Kasongo is ranked in the Chambers Global Guide 2025 for general business law in the DRC (Band 2).
            </div>
          </div>
        </div>
      </section>

      <section className="offices-section" id="offices">
        <div className="section-container">
          <div className="section-heading offices-heading">
            <p className="section-kicker">Ancrage local</p>
            <h2>Two offices, one team</h2>
          </div>
          <div className="office-cards">
            <article className="office-card">
              <span className="office-index">01 / Kinshasa</span>
              <h3>Kinshasa</h3>
              <p>Administrative and judicial seat; courts, ministries and institutional partners.</p>
            </article>
            <article className="office-card">
              <span className="office-index">02 / Haut-Katanga</span>
              <h3>Lubumbashi</h3>
              <p>In the heart of the mining province: titles, operators and subcontractors of Haut-Katanga.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-container faq-layout">
          <div className="section-heading faq-heading">
            <p className="section-kicker">Questions fréquentes</p>
            <h2>Frequently asked questions</h2>
          </div>
          <div className="faq-list">
            <details className="faq-item">
              <summary>What is a mining and quarry agent?<span aria-hidden="true">+</span></summary>
              <p>A mining and quarry agent assists with applications, renewals and follow-up of mining and quarry titles before the competent authorities in the DRC.</p>
            </details>
            <details className="faq-item">
              <summary>Why register a trademark in the DRC?<span aria-hidden="true">+</span></summary>
              <p>Registration helps establish rights to your brand and gives you legal tools to oppose unauthorised use and counterfeiting.</p>
            </details>
            <details className="faq-item">
              <summary>How are your fees calculated?<span aria-hidden="true">+</span></summary>
              <p>Fees depend on the nature, complexity and urgency of the matter. We discuss the scope and fee arrangements with you before starting work.</p>
            </details>
            <details className="faq-item">
              <summary>Do you act for foreign clients?<span aria-hidden="true">+</span></summary>
              <p>Yes. We advise foreign investors and companies entering the DRC, including on local structures, contracts, compliance and disputes.</p>
            </details>
            <details className="faq-item">
              <summary>Are my exchanges with the firm confidential?<span aria-hidden="true">+</span></summary>
              <p>Professional secrecy and confidentiality apply to our work in accordance with the rules governing the profession.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <div className="section-container contact-layout">
          <div className="contact-copy">
            <p className="section-kicker">Parlons de votre projet</p>
            <h2>Let&apos;s discuss your case</h2>
            <p className="contact-intro">Describe your need in a few lines. The firm will get back to you to arrange a first conversation.</p>
            <ul className="contact-promises">
              <li>Offices in Kinshasa and Lubumbashi</li>
              <li>Reply within two working days</li>
              <li>Exchanges covered by professional secrecy</li>
            </ul>
          </div>

          <form className="contact-form" action="mailto:contact@pkm.cd" method="post" encType="text/plain">
            <div className="form-row">
              <label>
                <span>Full name</span>
                <input name="name" autoComplete="name" required />
              </label>
              <label>
                <span>Phone</span>
                <input name="phone" type="tel" autoComplete="tel" />
              </label>
            </div>
            <label>
              <span>Email address</span>
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              <span>Subject</span>
              <select name="subject" defaultValue="business">
                <option value="business">Business law / litigation</option>
                <option value="mining">Mining titles and quarries</option>
                <option value="trademark">Trademarks and intellectual property</option>
                <option value="other">Other request</option>
              </select>
            </label>
            <label>
              <span>Your message</span>
              <textarea name="message" rows={5} required />
            </label>
            <button type="submit" className="form-submit">Send my request <ArrowUpRight size={13} /></button>
            <p className="form-note">This form opens your email app with the message pre-filled. It is not a legal consultation.</p>
          </form>
        </div>
      </section>

      <footer className="site-footer">
        <div className="section-container footer-layout">
          <div className="footer-brand-block">
            <a className="footer-brand" href="#top">Cabinet PKM</a>
            <p>Lawyers, mining and quarry agent, trademark and intellectual property agent.<br />Kinshasa and Lubumbashi, Democratic Republic of the Congo.</p>
          </div>
          <div className="footer-right">
            <nav className="footer-nav" aria-label="Navigation de pied de page">
              <a href="#expertise">Expertise</a>
              <a href="#the-firm">The firm</a>
              <a href="#faq">FAQ</a>
              <a href="#contact">Contact</a>
            </nav>
            <p className="copyright">© 2026 Cabinet PKM. The information on this site is general in nature and does not replace personalised legal advice.</p>
          </div>
        </div>
      </footer>

      <a className="floating-contact" href="#contact"><Mail size={14} /> Any questions?</a>
    </main>
  );

  return localize(page, language);
}
