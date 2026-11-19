/*
 * Jenkinsfile — CI/CD pipeline for MicroCRM
 *
 * Watches three subdirectories (frontend/, api-service/, notification-service/)
 * and builds/pushes only the Docker images whose source directories changed.
 *
 * Image tag = short Git commit SHA (not "latest").
 * Docker Hub credentials are provided via Jenkins credential ID 'docker-hub-credentials'.
 */

pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'mohussam'
        DOCKER_CREDENTIALS_ID = 'docker-hub-credentials'
        // Short Git commit SHA used as the image tag
        IMAGE_TAG = "${env.GIT_COMMIT?.take(7)}"
    }

    stages {
        // ── 1. Validate that a commit exists ──
        stage('Check commit') {
            steps {
                script {
                    if (!env.GIT_COMMIT) {
                        error 'GIT_COMMIT is not set. Pipeline requires a Git commit.'
                    }
                    echo "Building from commit: ${env.GIT_COMMIT}"
                    echo "Image tag will be: ${IMAGE_TAG}"
                }
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([
                usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )
            ]) {
                    sh '''
                    echo "$DOCKER_PASSWORD" | docker login \
                        -u "$DOCKER_USERNAME" \
                        --password-stdin
                '''
                }
            }
        }

        // ── 2. Parallel builds — each runs only when its source changes ──
        stage('Build & Push Images') {
            parallel {
                // ── Frontend ──
                stage('frontend') {
                    when {
                        changeset 'frontend/**'
                    }
                    steps {
                        script {
                            echo 'Changes detected in frontend/. Building frontend image...'

                            dir('frontend') {

                                // Build the Docker image
                                def imageName = "${DOCKER_REGISTRY}/microcrm-frontend:${IMAGE_TAG}"
                                sh "docker build -t ${imageName} ."

                                // Push to Docker Hub
                                docker.withRegistry('', DOCKER_CREDENTIALS_ID) {
                                    sh "docker push ${imageName}"
                                }

                                echo "Successfully pushed ${imageName}"
                            }
                        }
                    }
                }

                // ── API Service ──
                stage('api-service') {
                    when {
                        changeset 'api-service/**'
                    }
                    steps {
                        script {
                            echo 'Changes detected in api-service/. Building API service image...'

                            dir('api-service') {

                                // Build the Docker image
                                def imageName = "${DOCKER_REGISTRY}/microcrm-api:${IMAGE_TAG}"
                                sh "docker build -t ${imageName} ."

                                // Push to Docker Hub
                                docker.withRegistry('', DOCKER_CREDENTIALS_ID) {
                                    sh "docker push ${imageName}"
                                }

                                echo "Successfully pushed ${imageName}"
                            }
                        }
                    }
                }

                // ── Notification Service ──
                stage('notification-service') {
                    when {
                        changeset 'notification-service/**'
                    }
                    steps {
                        script {
                            echo 'Changes detected in notification-service/. Building notification image...'

                            dir('notification-service') {

                                // Build the Docker image
                                def imageName = "${DOCKER_REGISTRY}/microcrm-notification:${IMAGE_TAG}"
                                sh "docker build -t ${imageName} ."

                                // Push to Docker Hub
                                docker.withRegistry('', DOCKER_CREDENTIALS_ID) {
                                    sh "docker push ${imageName}"
                                }

                                echo "Successfully pushed ${imageName}"
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully. Images tagged with ${IMAGE_TAG}."
        }
        failure {
            echo 'Pipeline failed. Check the logs for details.'
        }
    }
}
