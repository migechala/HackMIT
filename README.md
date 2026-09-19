# HackMIT Project

## The Problem

Across major cities in the United States, there is a growing number of underutilized or completely unused urban spaces. These can include abandoned or nearly empty shopping malls, vacant office buildings, unused parking lots, undeveloped parcels of land, abandoned industrial properties, and other spaces that no longer serve their original purpose.

At the same time, cities continue to face increasing demand for housing, commercial development, public spaces, renewable-energy infrastructure, urban agriculture, community facilities, and other forms of development. In many cases, potentially useful spaces already exist, but discovering them and determining whether they are suitable for a particular project can be extremely difficult.

The information needed to evaluate a property is often scattered across many different sources. A developer may need to look at zoning information, property records, environmental conditions, weather patterns, land value, historical usage, building condition, surrounding infrastructure, pedestrian traffic, and other factors before determining whether a location is viable.

This creates an opportunity to build a system that automatically identifies and evaluates underutilized urban spaces.

Our HackMIT project will focus on creating a scalable platform that allows users to search an area of a city and discover spaces that could potentially be reused or redeveloped based on their specific needs.

For example, a user could ask the system to identify locations suitable for:

* Urban gardens or green spaces
* Solar installations
* Small businesses
* Community centers
* Housing projects
* Pop-up stores
* Warehouses or logistics facilities
* Public infrastructure
* Environmental restoration projects
* Recreational spaces

Instead of manually researching dozens or hundreds of properties, the user would describe what they are looking for and select a geographic area. Our system would then aggregate available information about the surrounding land and buildings, analyze that information using an AI model, and return the locations that appear to best satisfy the user's requirements.

If time permits during HackMIT, we would also like to extend the project beyond discovery. The platform could help users determine who owns a property, estimate its value, and potentially generate an initial offer or proposal for acquiring, leasing, or redeveloping the space.

The broader goal is to transform unused urban space into a searchable and actionable resource.

We are specifically interested in designing the project around the **ASUS HackMIT track, Voltage HackMIT track, SpaceX track, Cognition track, and Arduino track**, with different parts of our architecture demonstrating how hardware, edge computing, artificial intelligence, geographic data, and agentic systems can work together.

## Our Plan

The platform would operate as a multi-stage system combining a web-based frontend, backend infrastructure, edge hardware, external data sources, and an AI model running on local high-performance computing hardware.

### 1. User Selects an Area and Describes Their Needs

From the frontend, the user will interact with a map and select a geographic region they want the system to analyze.

This could be a relatively small area, such as a city block or approximately **10 m²**, or a significantly larger region depending on the use case and available computing resources.

The user would also describe what they are trying to build or find.

For example, a user might request:

> "Find unused land suitable for an urban community garden."

Another user might request:

> "Find an abandoned commercial property with high pedestrian traffic that could be converted into a small retail space."

The frontend would convert the selected geographic area and the user's requirements into a structured request that can be processed by the backend.

### 2. Request Is Sent to the Backend

The request will be sent to our backend infrastructure.

As part of our hardware architecture, we plan to incorporate an **Arduino UNO Q 4GB** into the system. The Arduino could act as part of the request-routing or load-management layer, helping coordinate incoming requests and demonstrating how lightweight edge hardware can participate in a larger distributed AI system.

The backend will maintain a queue of analysis requests and determine when each request should be sent to the main AI computing system.

### 3. ASUS Ascent GX10 Performs the Main Analysis

Once the request is ready to be processed, it will be sent to our **ASUS Ascent GX10 AI Supercomputer**.

The GX10 will act as the main local AI inference and data-processing system.

The system will query multiple APIs, public datasets, geographic databases, and potentially satellite or mapping services to collect information about properties within the selected region.

Rather than relying on a single source of information, the system will attempt to build a combined profile for each candidate property.

The AI model will then compare each location against the user's requirements.

For example, if someone is looking for land suitable for a community garden, the model might prioritize:

* High sunlight exposure
* Suitable soil conditions
* Low property cost
* Minimal existing development
* Good pedestrian accessibility
* Appropriate zoning
* Available water infrastructure

However, if the user is searching for a retail location, the model might instead prioritize:

* Foot traffic
* Visibility
* Road access
* Nearby businesses
* Population density
* Building condition
* Renovation cost

This allows the same platform to support many different urban-development use cases.

### 4. Candidate Locations Are Ranked

After gathering and analyzing the available data, the AI model will generate a set of candidate locations.

Each location could receive a suitability score based on how closely it matches the user's requirements.

The system could also explain why a particular location was selected.

For example:

> **Candidate Property A — 87% Match**

> High pedestrian traffic, strong street visibility, relatively low estimated renovation cost, and currently underutilized commercial zoning.

This explainability component would make the system more useful than a simple property-search engine because users would be able to understand the reasoning behind each recommendation.

### 5. Results Are Displayed on an Interactive Map

The results will then be sent back to the frontend.

The user will see an interactive map containing markers for each property or piece of land identified by the system.

Selecting a marker would display additional information about that location, potentially including:

* Property type
* Estimated property value
* Current usage
* Historical usage
* Ownership information
* Zoning information
* Environmental conditions
* Repair requirements
* Estimated redevelopment cost
* Foot traffic
* Weather conditions
* Sunlight exposure
* Soil conditions
* Model suitability score
* Explanation of why the property matches the user's request

The goal is to give the user enough information to quickly determine whether a particular property deserves further investigation.

### 6. Optional Property Acquisition Feature

If time permits, we would like to add an additional feature that helps move the user from **discovery to action**.

Once a user identifies an interesting property, the system could retrieve available ownership and valuation information and help generate an initial proposal.

For example, the system could produce:

* An estimated property value
* Estimated redevelopment costs
* A suggested offer range
* A draft acquisition or leasing proposal
* Contact information for the owner, when publicly available

This would make the platform not only a tool for discovering underutilized spaces but potentially a complete starting point for urban redevelopment projects.

## Data Required for the Model

To accurately evaluate whether a location is suitable for reuse, our system will need to collect and combine several different categories of data.

### Sunlight

Sunlight exposure can be extremely important for applications such as solar power generation, urban agriculture, public parks, and residential development.

Potential data could include:

* Average daily sunlight
* Seasonal sunlight variation
* Building shadows
* Nearby structures
* Solar exposure

### Soil Quality

For vacant land, especially land being considered for agriculture, parks, or environmental restoration, soil conditions may significantly affect the viability of a project.

Relevant information could include:

* Soil composition
* Drainage
* Contamination
* pH
* Previous industrial use

### Historical Usage

Understanding how a property was previously used could reveal both opportunities and potential risks.

For example, a former industrial site may require environmental remediation, while an abandoned retail property may already contain useful infrastructure.

The model could attempt to determine:

* Previous businesses
* Previous building types
* Historical zoning
* Duration of vacancy
* Previous industrial activity

### Property Value

The system should estimate the financial cost associated with acquiring or leasing the property.

Possible data could include:

* Assessed property value
* Recent sale prices
* Nearby comparable properties
* Property taxes
* Estimated market value

### Current State of the Property

The physical condition of the property is another important factor.

The system could attempt to identify whether the location is:

* Vacant
* Abandoned
* Partially occupied
* Structurally damaged
* Overgrown
* Demolished
* Under construction
* Currently operating

### Land or Property Type

The system will need to classify each candidate location.

Possible classifications include:

* Residential
* Commercial
* Industrial
* Agricultural
* Public
* Parking
* Vacant land
* Mixed-use
* Warehouse
* Office
* Retail

### Location

Geographic information will form the foundation of the system.

Important location data could include:

* Latitude and longitude
* Neighborhood
* Nearby roads
* Public transportation
* Distance from population centers
* Nearby businesses
* Schools
* Parks
* Utilities
* Infrastructure

### Weather

Weather information can affect many potential uses of a property.

The system could consider:

* Average temperature
* Rainfall
* Snowfall
* Wind
* Extreme weather events
* Flooding risk
* Heat exposure

### Damage

For existing structures, the system should estimate the condition of the property and identify visible or documented damage.

Potential damage categories could include:

* Roof damage
* Structural damage
* Fire damage
* Water damage
* Broken windows
* Foundation problems
* Exterior deterioration
* Environmental contamination

### Foot Traffic

Foot traffic is particularly important when evaluating commercial, retail, community, or public-use properties.

Potential signals could include:

* Pedestrian density
* Nearby attractions
* Public transportation usage
* Nearby businesses
* Event activity
* Population density

### Visibility

Some projects depend heavily on how visible a location is from surrounding roads and pedestrian areas.

For example, retail stores may benefit from highly visible street frontage, while warehouses may not require significant visibility.

Possible measurements could include:

* Road frontage
* Nearby intersections
* Street visibility
* Traffic volume
* Pedestrian visibility

### Cost to Repair or Redevelop

Finally, the system should attempt to estimate how much investment would be required before the property could be reused.

This could include:

* Structural repairs
* Demolition
* Construction
* Environmental cleanup
* Electrical work
* Plumbing
* Roofing
* Landscaping
* Code compliance
* Accessibility upgrades

By combining these factors, our model could create a much more complete picture of a property's redevelopment potential than any single dataset could provide.

## Overall Vision

The ultimate goal of the project is to create an **AI-powered search engine for underutilized urban space**.

Instead of asking:

> "What vacant properties exist in this city?"

we want users to be able to ask:

> "Where in this city could I realistically build this idea?"

The platform would then combine geographic data, public records, environmental information, property information, and AI reasoning to identify the most promising locations.

If successful, the system could potentially be useful for real-estate developers, entrepreneurs, urban planners, environmental organizations, local governments, architects, researchers, and community organizations.

By making unused urban spaces easier to discover and evaluate, we hope to demonstrate how AI and modern computing infrastructure can help cities make better use of the land and buildings they already have.
