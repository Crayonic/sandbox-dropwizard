call mvn clean package
java -DdbHost=localhost -DdbPort=27017 -jar target\sandbox-dropwizard-0.0.1-SNAPSHOT.jar server config.yml