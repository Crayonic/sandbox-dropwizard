FROM java:8-jre
MAINTAINER marek
EXPOSE 8080 8081
COPY maven /maven/
CMD java -DdbHost=$DB_PORT_27017_TCP_ADDR \
										-DdbPort=$DB_PORT_27017_TCP_PORT -jar \
										/maven/sandbox-dropwizard-0.0.1-SNAPSHOT.jar server \
										/maven/config.yml
