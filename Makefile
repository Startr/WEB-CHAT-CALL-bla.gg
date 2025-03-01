help: 
	@echo "================================================"
	@echo "       bla.gg - P2P Chat Platform"
	@echo "================================================"
	@echo "This is the default make command."
	@echo "This command lists available make commands."
	@echo ""
	@echo "Usage example:"
	@echo "    make frontend"
	@echo ""
	@echo "Available make commands:"
	@echo ""
	@LC_ALL=C $(MAKE) -pRrq -f $(firstword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/(^|\n)# Files(\n|$$)/,/(^|\n)# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | grep -E -v -e '^[^[:alnum:]]' -e '^$@$$'
	@echo ""

frontend:
	@echo "Starting frontend server on port 8000..."
	@cd frontend && python3 server.py

tunnel:
	@echo "Starting Cloudflare tunnel to port 8000..."
	@cloudflared tunnel --url http://localhost:8000

all: frontend-bg tunnel
	@echo "Started frontend server and Cloudflare tunnel"

frontend-bg:
	@echo "Starting frontend server in background..."
	@cd frontend && (python3 server.py > /dev/null 2>&1 &)

stop:
	@echo "Stopping all services..."
	@pkill -f "python3 server.py" || true
	@pkill -f "cloudflared tunnel" || true
	@echo "All services stopped"

restart: stop all
	@echo "All services restarted"

backend:
	@echo "Starting backend services with Docker Compose..."
	@cd backend && docker-compose up

backend-detach:
	@echo "Starting backend services with Docker Compose in detached mode..."
	@cd backend && docker-compose up -d

backend-stop:
	@echo "Stopping backend services..."
	@cd backend && docker-compose down

clean:
	@echo "Cleaning up temporary files..."
	@find . -name "*.pyc" -delete
	@find . -name "__pycache__" -delete
	@find . -name "*.log" -delete
	@echo "Cleanup complete"

minor_release:
	# Start a minor release with incremented minor version
	git flow release start $$(git tag --sort=-v:refname | sed 's/^v//' | head -n 1 | awk -F'.' '{print $$1"."$$2+1".0"}')

patch_release:
	# Start a patch release with incremented patch version
	git flow release start $$(git tag --sort=-v:refname | sed 's/^v//' | head -n 1 | awk -F'.' '{print $$1"."$$2"."$$3+1}')

major_release:
	# Start a major release with incremented major version
	git flow release start $$(git tag --sort=-v:refname | sed 's/^v//' | head -n 1 | awk -F'.' '{print $$1+1".0.0"}')

hotfix:
	# Start a hotfix with incremented patch version
	git flow hotfix start $$(git tag --sort=-v:refname | sed 's/^v//' | head -n 1 | awk -F'.' '{print $$1"."$$2"."$$3+1}')

release_finish:
	git flow release finish "$$(git branch --show-current | sed 's/release\///')" && git push origin develop && git push origin master && git push --tags && git checkout develop

hotfix_finish:
	git flow hotfix finish "$$(git branch --show-current | sed 's/hotfix\///')" && git push origin develop && git push origin master && git push --tags && git checkout develop

things_clean:
	git clean --exclude=!.env -Xdf 