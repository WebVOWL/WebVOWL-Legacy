# Package project into a WAR file using Maven
FROM maven:3.6.3-openjdk-8 AS build
ENV PROJECT_PATH=/home/project

# Build WebVOWL
RUN apt-get update && apt-get install bzip2 -y
WORKDIR $PROJECT_PATH/webvowl
COPY *.* ./
COPY src src
RUN mvn -B package --file pom.xml -DskipTests

# Build OWL2VOWL
WORKDIR $PROJECT_PATH
RUN git clone "https://github.com/VisualDataWeb/OWL2VOWL.git"
WORKDIR $PROJECT_PATH/OWL2VOWL
RUN mvn -B package --file pom.xml -P war-release -DskipTests

# Build the final image
FROM tomcat:9-jre8-temurin
ENV PROJECT_PATH=/home/project

RUN rm -rf /usr/local/tomcat/webapps/*
COPY --from=build $PROJECT_PATH/webvowl/target/*.war $CATALINA_HOME/webapps/ROOT.war
COPY --from=build $PROJECT_PATH/OWL2VOWL/target/*.war $CATALINA_HOME/webapps/o2v.war

LABEL org.opencontainers.image.description="A faster WebVOWL"
EXPOSE 8080

ENTRYPOINT ["catalina.sh", "run"]
