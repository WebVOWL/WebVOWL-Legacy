# Package project into a WAR file using Maven
FROM maven:3.6.3-openjdk-8 AS build
ENV PROJECT_PATH=/app

# Build WebVOWL
WORKDIR $PROJECT_PATH/webvowl
COPY Gruntfile.js ./
COPY license.txt ./
COPY package.json ./
COPY paths.js ./
COPY pom.xml ./
COPY webpack.config.js ./
COPY src src
RUN mvn -B package --file pom.xml -P production -DskipTests

# Build OWL2VOWL
WORKDIR $PROJECT_PATH
RUN git clone "https://github.com/VisualDataWeb/OWL2VOWL.git"
WORKDIR $PROJECT_PATH/OWL2VOWL
RUN mvn -B package --file pom.xml -P war-release -DskipTests

# Build the final image
FROM tomcat:9-jre8-temurin
ENV PROJECT_PATH=/app

RUN rm -rf /usr/local/tomcat/webapps/*
COPY --from=build $PROJECT_PATH/webvowl/target/*.war $CATALINA_HOME/webapps/ROOT.war
COPY --from=build $PROJECT_PATH/OWL2VOWL/target/*.war $CATALINA_HOME/webapps/o2v.war

EXPOSE 8080

ENTRYPOINT ["catalina.sh", "run"]
